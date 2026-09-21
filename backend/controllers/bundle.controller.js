const slugify = require('slugify');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Bundle = require('../models/Bundle');
const ProductVariant = require('../models/ProductVariant');
const SellerProfile = require('../models/SellerProfile');
const { applyDiscount, round2 } = require('../services/pricing.service');
const { assertStockAvailable } = require('../services/stock.service');
const { getOrCreateCart } = require('./cart.controller');
const { serializeCart } = require('./cart.controller');

/**
 * Resolves the selections to price: for a `fixed` bundle the selections are
 * ignored and bundle.items is authoritative; for `configurable`, every
 * submitted variant must be one of bundle.items and within its
 * min/max quantity rule.
 */
function resolveEffectiveSelections(bundle, selections) {
  if (bundle.bundleType === 'fixed') {
    return bundle.items.map((rule) => ({ variant: rule.variant, quantity: rule.quantity || 1 }));
  }

  const reasons = [];
  const ruleByVariant = new Map(bundle.items.map((rule) => [String(rule.variant), rule]));

  for (const sel of selections || []) {
    if (!Number.isInteger(sel.quantity) || sel.quantity < 1) {
      reasons.push(`Quantity for variant ${sel.variant} must be a positive integer`);
      continue;
    }
    const rule = ruleByVariant.get(String(sel.variant));
    if (!rule) { reasons.push(`Variant ${sel.variant} is not part of this bundle`); continue; }
    const min = rule.minQuantity ?? 1;
    const max = rule.maxQuantity ?? Infinity;
    if (sel.quantity < min || sel.quantity > max) {
      reasons.push(`Quantity for variant ${sel.variant} must be between ${min} and ${max}`);
    }
  }

  const totalItems = (selections || []).reduce((sum, s) => sum + s.quantity, 0);
  if (bundle.minItems && totalItems < bundle.minItems) reasons.push(`Select at least ${bundle.minItems} items`);
  if (bundle.maxItems && totalItems > bundle.maxItems) reasons.push(`Select at most ${bundle.maxItems} items`);

  return { selections: selections || [], reasons };
}

async function computeQuote(bundle, selections) {
  const effective = bundle.bundleType === 'fixed'
    ? resolveEffectiveSelections(bundle, selections)
    : resolveEffectiveSelections(bundle, selections).selections;

  const lines = [];
  let subtotal = 0;
  for (const sel of effective) {
    const variant = await ProductVariant.findById(sel.variant);
    if (!variant || !variant.isActive) throw ApiError.badRequest('One of the selected variants is unavailable');
    const lineTotal = round2(variant.price * sel.quantity);
    subtotal = round2(subtotal + lineTotal);
    lines.push({ variant: variant._id, unitPrice: variant.price, quantity: sel.quantity, lineTotal });
  }

  let total;
  if (bundle.bundlePrice !== undefined && bundle.bundlePrice !== null) {
    total = bundle.bundlePrice;
  } else {
    total = applyDiscount(subtotal, bundle.discountType, bundle.discountValue);
  }

  return { subtotal, discountTotal: round2(subtotal - total), total: round2(total), items: lines, effectiveSelections: effective };
}

// GET /api/bundles
const list = asyncHandler(async (req, res) => {
  const bundles = await Bundle.find({ isActive: true }).sort({ createdAt: -1 });
  sendSuccess(res, { data: bundles });
});

// GET /api/bundles/:id
const getById = asyncHandler(async (req, res) => {
  const bundle = await Bundle.findById(req.params.id);
  if (!bundle) throw ApiError.notFound('Bundle not found');
  sendSuccess(res, { data: bundle });
});

// POST /api/bundles/:id/validate
const validateSelection = asyncHandler(async (req, res) => {
  const bundle = await Bundle.findById(req.params.id);
  if (!bundle || !bundle.isActive) throw ApiError.notFound('Bundle not found');

  if (bundle.bundleType === 'fixed') return sendSuccess(res, { data: { valid: true } });

  const { reasons } = resolveEffectiveSelections(bundle, req.body.selections);
  sendSuccess(res, { data: { valid: reasons.length === 0, reasons: reasons.length ? reasons : undefined } });
});

// POST /api/bundles/:id/quote
const quote = asyncHandler(async (req, res) => {
  const bundle = await Bundle.findById(req.params.id);
  if (!bundle || !bundle.isActive) throw ApiError.notFound('Bundle not found');

  if (bundle.bundleType === 'configurable') {
    const { reasons } = resolveEffectiveSelections(bundle, req.body.selections);
    if (reasons.length) throw ApiError.badRequest('Invalid bundle selection', reasons.map((r) => ({ message: r })));
  }

  const result = await computeQuote(bundle, req.body.selections);
  sendSuccess(res, { data: { subtotal: result.subtotal, discountTotal: result.discountTotal, total: result.total, items: result.items } });
});

// POST /api/bundles/:id/add-to-cart
const addToCart = asyncHandler(async (req, res) => {
  const bundle = await Bundle.findById(req.params.id);
  if (!bundle || !bundle.isActive) throw ApiError.notFound('Bundle not found');

  if (bundle.bundleType === 'configurable') {
    const { reasons } = resolveEffectiveSelections(bundle, req.body.selections);
    if (reasons.length) throw ApiError.badRequest('Invalid bundle selection', reasons.map((r) => ({ message: r })));
  }

  const result = await computeQuote(bundle, req.body.selections);
  await assertStockAvailable(result.items.map((i) => ({ variantId: i.variant, quantity: i.quantity })));

  const cart = await getOrCreateCart(req.user._id);
  for (const line of result.items) {
    const existing = cart.items.find((i) => String(i.variant) === String(line.variant));
    if (existing) existing.quantity += line.quantity;
    else cart.items.push({ variant: line.variant, quantity: line.quantity });
  }
  await cart.save();

  sendSuccess(res, { data: await serializeCart(cart), message: 'Bundle added to cart' });
});

// ---- Seller/Admin write operations --------------------------------------------

// POST /api/bundles
const create = asyncHandler(async (req, res) => {
  let sellerId = req.body.seller || null;
  if (req.user.role === 'seller') {
    const profile = await SellerProfile.findOne({ user: req.user._id });
    if (!profile) throw ApiError.forbidden('Complete your seller application first');
    sellerId = profile._id;
  }
  const slug = await uniqueSlug(req.body.nameEn);
  const bundle = await Bundle.create({ ...req.body, seller: sellerId, slug });
  sendSuccess(res, { statusCode: 201, data: bundle, message: 'Bundle created' });
});

const update = asyncHandler(async (req, res) => {
  const bundle = await Bundle.findById(req.params.id);
  if (!bundle) throw ApiError.notFound('Bundle not found');
  await assertOwnsBundle(req.user, bundle);

  Object.assign(bundle, req.body);
  await bundle.save();
  sendSuccess(res, { data: bundle, message: 'Bundle updated' });
});

const remove = asyncHandler(async (req, res) => {
  const bundle = await Bundle.findById(req.params.id);
  if (!bundle) throw ApiError.notFound('Bundle not found');
  await assertOwnsBundle(req.user, bundle);

  bundle.isActive = false;
  await bundle.save();
  sendSuccess(res, { data: null, message: 'Bundle deactivated' });
});

async function assertOwnsBundle(user, bundle) {
  if (user.role === 'admin') return;
  if (user.role !== 'seller') throw ApiError.forbidden();
  const profile = await SellerProfile.findOne({ user: user._id });
  if (!profile || String(bundle.seller) !== String(profile._id)) throw ApiError.forbidden('You do not own this bundle');
}

async function uniqueSlug(name, excludeId) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base, counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Bundle.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
}

module.exports = { list, getById, validateSelection, quote, addToCart, create, update, remove };
