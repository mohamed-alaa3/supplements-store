const slugify = require('slugify');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const SellerProfile = require('../models/SellerProfile');
const User = require('../models/User');
const Order = require('../models/Order');
const { getOrCreateSellerProfile } = require('../utils/sellerProfile');

// GET /api/sellers/me
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getOrCreateSellerProfile(req.user);
  sendSuccess(res, { data: profile });
});

// PATCH /api/sellers/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await getOrCreateSellerProfile(req.user);

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
  const profile = await getOrCreateSellerProfile(req.user);

  const orders = await Order.find({ 'items.seller': profile._id }).sort({ createdAt: -1 });
  sendSuccess(res, { data: orders });
});

// PATCH /api/seller/orders/:orderId/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const profile = await getOrCreateSellerProfile(req.user);

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

  const profile = await getOrCreateSellerProfile(req.user);

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
// (still used to suspend/reactivate an existing seller account — the
// "pending" state is no longer produced by any flow, see convertToSeller
// below, but is kept in the schema/enum for backward compatibility with any
// seller profiles created under the old apply-and-wait-for-approval flow.)
const adminSetSellerStatus = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findById(req.params.id);
  if (!profile) throw ApiError.notFound('Seller profile not found');
  profile.status = req.body.status;
  await profile.save();
  sendSuccess(res, { data: profile, message: 'Seller status updated' });
});

// POST /api/admin/users/:id/convert-to-seller
// Admin-only, one-step conversion: no application, no file/ID upload, no
// waiting for approval. Creates (or re-activates) an *active* SellerProfile
// for the target user and flips their role to "seller" in the same request,
// so both permissions and the Seller Dashboard are available immediately —
// no separate approval step exists anywhere in this flow.
const adminConvertToSeller = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) throw ApiError.notFound('User not found');

  if (targetUser.role === 'admin') {
    throw ApiError.badRequest('Admins cannot be converted to sellers');
  }

  let profile = await SellerProfile.findOne({ user: targetUser._id });

  if (profile) {
    // Self-healing path: also covers accounts that were previously promoted
    // via the generic role-change endpoint and ended up with role=seller
    // but no profile, or a profile stuck at status "pending"/"suspended".
    profile.status = 'active';
    if (req.body.storeName) {
      profile.storeName = req.body.storeName;
      profile.slug = await uniqueSlug(req.body.storeName, profile._id);
    }
    await profile.save();
  } else {
    const storeName = req.body.storeName || `${targetUser.fullName}'s Store`;
    const slug = await uniqueSlug(storeName);
    profile = await SellerProfile.create({
      user: targetUser._id,
      storeName,
      slug,
      status: 'active'
    });
  }

  targetUser.role = 'seller';
  await targetUser.save();

  sendSuccess(res, {
    statusCode: 200,
    data: { user: targetUser, sellerProfile: profile },
    message: 'User converted to seller'
  });
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
  getMyProfile, updateMyProfile, listActiveSellers, getSellerStorefront,
  getMyOrders, updateOrderStatus, getMySummary, adminSetSellerStatus, adminConvertToSeller
};
