const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Coupon = require('../models/Coupon');
const { evaluateCoupon } = require('../services/coupon.service');
const { getOrCreateCart, serializeCart } = require('./cart.controller');

// POST /api/coupons/validate — validates a code against the caller's current cart
const validateAgainstCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const serialized = await serializeCart(cart);

  const evaluation = await evaluateCoupon(req.body.code, {
    userId: req.user._id,
    subtotal: serialized.subtotal,
    productIds: serialized.items.map((i) => String(i.productId)),
    categoryIds: []
  });

  sendSuccess(res, {
    data: { valid: evaluation.valid, discountAmount: evaluation.discountAmount, reason: evaluation.reason }
  });
});

// ---- Admin ------------------------------------------------------------------

const adminList = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  sendSuccess(res, { data: coupons });
});

const adminCreate = asyncHandler(async (req, res) => {
  const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });
  if (existing) throw ApiError.conflict('Coupon code already exists');

  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
  sendSuccess(res, { statusCode: 201, data: coupon, message: 'Coupon created' });
});

const adminUpdate = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  Object.assign(coupon, req.body);
  await coupon.save();
  sendSuccess(res, { data: coupon, message: 'Coupon updated' });
});

const adminDeactivate = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  coupon.isActive = false;
  await coupon.save();
  sendSuccess(res, { data: null, message: 'Coupon deactivated' });
});

module.exports = { validateAgainstCart, adminList, adminCreate, adminUpdate, adminDeactivate };
