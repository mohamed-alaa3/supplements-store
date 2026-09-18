const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const SellerProfile = require('../models/SellerProfile');

/** Confirms req.user (seller or admin) owns the product this variant belongs (or will belong) to. */
async function assertOwnsProduct(user, productId) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (user.role === 'admin') return product;

  const profile = await SellerProfile.findOne({ user: user._id });
  if (!profile || String(product.seller) !== String(profile._id)) {
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

  const variant = await ProductVariant.create({ ...req.body, product: req.params.productId });
  await Inventory.create({ variant: variant._id, stockQuantity: 0, trackInventory: true });

  sendSuccess(res, { statusCode: 201, data: variant, message: 'Variant created' });
});

// PATCH /api/variants/:variantId
const update = asyncHandler(async (req, res) => {
  const variant = await ProductVariant.findById(req.params.variantId);
  if (!variant) throw ApiError.notFound('Variant not found');
  await assertOwnsProduct(req.user, variant.product);

  Object.assign(variant, req.body);
  await variant.save();
  sendSuccess(res, { data: variant, message: 'Variant updated' });
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
