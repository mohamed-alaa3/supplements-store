const slugify = require('slugify');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const SellerProfile = require('../models/SellerProfile');
const Order = require('../models/Order');

// POST /api/sellers/apply
const apply = asyncHandler(async (req, res) => {
  const existing = await SellerProfile.findOne({ user: req.user._id });
  if (existing) throw ApiError.conflict('You already have a seller application on file');

  const { storeName, description, contactPhone } = req.body;
  if (!storeName) throw ApiError.badRequest('storeName is required');

  const slug = await uniqueSlug(storeName);
  const profile = await SellerProfile.create({
    user: req.user._id, storeName, slug, description, contactPhone, status: 'pending'
  });

  // Promote the user's role so seller-only UI/guards work immediately;
  // `status` still gates real permissions server-side until an admin approves.
  req.user.role = 'seller';
  await req.user.save();

  sendSuccess(res, { statusCode: 201, data: profile, message: 'Seller application submitted' });
});

// GET /api/sellers/me
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound('No seller profile found for this account');
  sendSuccess(res, { data: profile });
});

// PATCH /api/sellers/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound('No seller profile found for this account');

  const { storeName, description, contactPhone, logoUrl } = req.body;
  if (storeName && storeName !== profile.storeName) {
    profile.storeName = storeName;
    profile.slug = await uniqueSlug(storeName, profile._id);
  }
  if (description !== undefined) profile.description = description;
  if (contactPhone !== undefined) profile.contactPhone = contactPhone;
  if (logoUrl !== undefined) profile.logoUrl = logoUrl;

  await profile.save();
  sendSuccess(res, { data: profile, message: 'Seller profile updated' });
});

// GET /api/sellers
const listActiveSellers = asyncHandler(async (req, res) => {
  const sellers = await SellerProfile.find({ status: 'active' }).sort({ storeName: 1 });
  sendSuccess(res, { data: sellers });
});

// GET /api/sellers/:id
const getSellerStorefront = asyncHandler(async (req, res) => {
  const seller = await SellerProfile.findById(req.params.id);
  if (!seller || seller.status !== 'active') throw ApiError.notFound('Seller not found');
  sendSuccess(res, { data: seller });
});

// GET /api/seller/orders — orders containing at least one of this seller's items
const getMyOrders = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound('No seller profile found for this account');

  const orders = await Order.find({ 'items.seller': profile._id }).sort({ createdAt: -1 });
  sendSuccess(res, { data: orders });
});

// PATCH /api/seller/orders/:orderId/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound('No seller profile found for this account');

  const order = await Order.findOne({ _id: req.params.orderId, 'items.seller': profile._id });
  if (!order) throw ApiError.notFound('Order not found for this seller');

  order.orderStatus = req.body.status;
  await order.save();
  sendSuccess(res, { data: order, message: 'Order status updated' });
});

// GET /api/seller/summary
const getMySummary = asyncHandler(async (req, res) => {
  const Product = require('../models/Product');
  const Inventory = require('../models/Inventory');
  const ProductVariant = require('../models/ProductVariant');

  const profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound('No seller profile found for this account');

  const [totalProducts, activeProducts, orders] = await Promise.all([
    Product.countDocuments({ seller: profile._id }),
    Product.countDocuments({ seller: profile._id, isActive: true }),
    Order.find({ 'items.seller': profile._id })
  ]);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => {
    const sellerLines = order.items.filter((i) => String(i.seller) === String(profile._id));
    return sum + sellerLines.reduce((s, i) => s + i.lineTotal, 0);
  }, 0);

  const variantIds = await ProductVariant.find({ product: { $in: await Product.find({ seller: profile._id }).distinct('_id') } }).distinct('_id');
  const lowStockVariants = await Inventory.countDocuments({ variant: { $in: variantIds }, status: 'low_stock' });

  sendSuccess(res, { data: { totalProducts, activeProducts, totalOrders, totalRevenue, lowStockVariants } });
});

// ---- Admin --------------------------------------------------------------------

// PATCH /api/admin/sellers/:id/status
const adminSetSellerStatus = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findById(req.params.id);
  if (!profile) throw ApiError.notFound('Seller profile not found');
  profile.status = req.body.status;
  await profile.save();
  sendSuccess(res, { data: profile, message: 'Seller status updated' });
});

async function uniqueSlug(name, excludeId) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await SellerProfile.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
}

module.exports = {
  apply, getMyProfile, updateMyProfile, listActiveSellers, getSellerStorefront,
  getMyOrders, updateOrderStatus, getMySummary, adminSetSellerStatus
};
