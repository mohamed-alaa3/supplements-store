const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { parsePagination } = require('../utils/pagination');
const User = require('../models/User');
const Address = require('../models/Address');

// GET /api/users/me
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: req.user });
});

// GET /api/users/me/addresses
const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, { data: addresses });
});

// POST /api/users/me/addresses
const createAddress = asyncHandler(async (req, res) => {
  const payload = { ...req.body, user: req.user._id };

  if (payload.isDefault) {
    await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  }

  const address = await Address.create(payload);
  sendSuccess(res, { statusCode: 201, data: address, message: 'Address added' });
});

// PATCH /api/users/me/addresses/:id
const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound('Address not found');

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  }

  Object.assign(address, req.body);
  await address.save();
  sendSuccess(res, { data: address, message: 'Address updated' });
});

// DELETE /api/users/me/addresses/:id
const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound('Address not found');
  sendSuccess(res, { data: null, message: 'Address removed' });
});

// PATCH /api/users/me/addresses/:id/default
const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound('Address not found');

  await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();

  sendSuccess(res, { data: address, message: 'Default address updated' });
});

// ---- Admin ------------------------------------------------------------------

// GET /api/admin/users
const adminListUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { fullName: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];

  const [items, totalItems] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  sendSuccess(res, { data: items, meta: buildMeta({ page, limit, totalItems }) });
});

// PATCH /api/admin/users/:id/status
const adminSetUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  user.isActive = !!req.body.isActive;
  await user.save();
  sendSuccess(res, { data: user, message: 'User status updated' });
});

// PATCH /api/admin/users/:id/role
const adminSetUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  user.role = req.body.role;
  await user.save();
  sendSuccess(res, { data: user, message: 'User role updated' });
});

module.exports = {
  getMe, listAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
  adminListUsers, adminSetUserStatus, adminSetUserRole
};
