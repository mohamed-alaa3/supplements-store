const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const SellerProfile = require('../models/SellerProfile');
const { getOrCreateSellerProfile } = require('../utils/sellerProfile');

/** Confirms req.user (seller or admin) owns the product this variant belongs (or will belong) to. */
async function assertOwnsProduct(user, productId) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (user.role === 'admin') return product;

  const profile = await getOrCreateSellerProfile(user);
  if (String(product.seller) !== String(profile._id)) {
    throw ApiError.forbidden('You do not own this product');
  }
  return product;
}

// GET /api/products/:productId/variants
const listForProduct = asyncHandler(async (req, res) => {
  const variants = await ProductVariant.find({ product: req.params.productId, isActive: true });
  const variantIds = variants.map((v) => v._id);
  const inventories = await Inventory.find({ variant: { $in: variantIds } });
  const byVariant = new Map(inventories.map((inv) => [String(inv.variant), inv]));

  const withStock = variants.map((v) => {
    const inv = byVariant.get(String(v._id));
    return {
      ...v.toObject(),
      stockQuantity: inv?.stockQuantity ?? 0,
      lowStockThreshold: inv?.lowStockThreshold ?? 5,
      trackInventory: inv?.trackInventory ?? true,
      stockState: inv ? inv.status : 'out_of_stock',
      availableQuantity: inv ? Math.max(0, inv.stockQuantity - inv.reservedQuantity) : 0
    };
  });

  sendSuccess(res, { data: withStock });
});

// POST /api/products/:productId/variants
const create = asyncHandler(async (req, res) => {
  await assertOwnsProduct(req.user, req.params.productId);

  const existingSku = await ProductVariant.findOne({ sku: req.body.sku.toUpperCase() });
  if (existingSku) throw ApiError.conflict('SKU already in use');

  const { stockQuantity = 0, lowStockThreshold, trackInventory, ...variantData } = req.body;
  const variant = await ProductVariant.create({ ...variantData, product: req.params.productId });
  const inventory = await Inventory.create({
    variant: variant._id,
    stockQuantity: Number(stockQuantity) || 0,
    ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
    ...(trackInventory !== undefined ? { trackInventory } : {})
  });

  sendSuccess(res, { statusCode: 201, data: { ...variant.toObject(), stockQuantity: inventory.stockQuantity, availableQuantity: Math.max(0, inventory.stockQuantity - inventory.reservedQuantity), stockState: inventory.status }, message: 'Variant created' });
});

// PATCH /api/variants/:variantId
const update = asyncHandler(async (req, res) => {
  const variant = await ProductVariant.findById(req.params.variantId);
  if (!variant) throw ApiError.notFound('Variant not found');
  await assertOwnsProduct(req.user, variant.product);

  const { stockQuantity, lowStockThreshold, trackInventory, ...variantData } = req.body;
  if (variantData.sku) {
    const duplicate = await ProductVariant.findOne({
      sku: variantData.sku.toUpperCase(),
      _id: { $ne: variant._id }
    });
    if (duplicate) throw ApiError.conflict('SKU already in use');
  }

  Object.assign(variant, variantData);
  await variant.save();

  let inventory = await Inventory.findOne({ variant: variant._id });
  if (!inventory) inventory = new Inventory({ variant: variant._id });
  if (stockQuantity !== undefined) inventory.stockQuantity = Number(stockQuantity);
  if (lowStockThreshold !== undefined) inventory.lowStockThreshold = Number(lowStockThreshold);
  if (trackInventory !== undefined) inventory.trackInventory = Boolean(trackInventory);
  await inventory.save();

  sendSuccess(res, {
    data: { ...variant.toObject(), stockQuantity: inventory.stockQuantity, availableQuantity: Math.max(0, inventory.stockQuantity - inventory.reservedQuantity), stockState: inventory.status },
    message: 'Variant updated'
  });
});

// DELETE /api/variants/:variantId
const remove = asyncHandler(async (req, res) => {
  const variant = await ProductVariant.findById(req.params.variantId);
  if (!variant) throw ApiError.notFound('Variant not found');
  await assertOwnsProduct(req.user, variant.product);

  variant.isActive = false;
  await variant.save();
  sendSuccess(res, { data: null, message: 'Variant deactivated' });
});

module.exports = { listForProduct, create, update, remove, assertOwnsProduct };
