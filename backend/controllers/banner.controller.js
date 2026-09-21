const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Banner = require('../models/Banner');

// GET /api/banners — only currently-active, currently-in-window banners, in display order
const list = asyncHandler(async (req, res) => {
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }] }
    ]
  }).sort({ sortOrder: 1 });
  sendSuccess(res, { data: banners });
});

const create = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  sendSuccess(res, { statusCode: 201, data: banner, message: 'Banner created' });
});

const update = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw ApiError.notFound('Banner not found');
  Object.assign(banner, req.body);
  await banner.save();
  sendSuccess(res, { data: banner, message: 'Banner updated' });
});

const remove = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw ApiError.notFound('Banner not found');
  banner.isActive = false;
  await banner.save();
  sendSuccess(res, { data: null, message: 'Banner deactivated' });
});

module.exports = { list, create, update, remove };
