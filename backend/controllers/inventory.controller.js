const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Inventory = require('../models/Inventory');
const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const SellerProfile = require('../models/SellerProfile');
const { assertOwnsProduct } = require('./variant.controller');

// GET /api/inventory/variant/:variantId
const getForVariant = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findOne({ variant: req.params.variantId });
  if (!inventory) throw ApiError.notFound('Inventory record not found');
  sendSuccess(res, { data: inventory });
});

// PATCH /api/inventory/variant/:variantId
const updateForVariant = asyncHandler(async (req, res) => {
  const variant = await ProductVariant.findById(req.params.variantId);
  if (!variant) throw ApiError.notFound('Variant not found');
  await assertOwnsProduct(req.user, variant.product);

  let inventory = await Inventory.findOne({ variant: variant._id });
  if (!inventory) inventory = new Inventory({ variant: variant._id });

  const { stockQuantity, lowStockThreshold, trackInventory } = req.body;
  if (stockQuantity !== undefined) inventory.stockQuantity = stockQuantity;
  if (lowStockThreshold !== undefined) inventory.lowStockThreshold = lowStockThreshold;
  if (trackInventory !== undefined) inventory.trackInventory = trackInventory;

  await inventory.save();
  sendSuccess(res, { data: inventory, message: 'Inventory updated' });
});

// GET /api/seller/inventory
const getMyInventory = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound('No seller profile found for this account');

  const productIds = await Product.find({ seller: profile._id }).distinct('_id');
  const variantIds = await ProductVariant.find({ product: { $in: productIds } }).distinct('_id');
  const inventories = await Inventory.find({ variant: { $in: variantIds } });

  sendSuccess(res, { data: inventories });
});

// GET /api/admin/inventory
const adminOverview = asyncHandler(async (req, res) => {
  const inventories = await Inventory.find().populate({
    path: 'variant',
    select: 'sku nameAr nameEn product',
    populate: { path: 'product', select: 'nameAr nameEn' }
  });
  sendSuccess(res, { data: inventories });
});

// POST /api/admin/inventory/adjustments
const adminAdjust = asyncHandler(async (req, res) => {
  const { variant, quantityChange, reason } = req.body;
  if (!variant || typeof quantityChange !== 'number' || !reason) {
    throw ApiError.badRequest('variant, quantityChange and reason are required');
  }

  let inventory = await Inventory.findOne({ variant });
  if (!inventory) inventory = new Inventory({ variant });

  inventory.stockQuantity = Math.max(0, inventory.stockQuantity + quantityChange);
  await inventory.save();

  sendSuccess(res, { data: inventory, message: `Inventory adjusted (${reason})` });
});

module.exports = { getForVariant, updateForVariant, getMyInventory, adminOverview, adminAdjust };
