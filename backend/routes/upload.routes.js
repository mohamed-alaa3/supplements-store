const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { protect } = require('../middlewares/protect');
const authorize = require('../middlewares/authorize');
const { uploadImage } = require('../middlewares/upload');

// POST /api/uploads/image — multipart/form-data, field name "image".
// Returns a relative URL under /uploads/<filename> that other resources
// (ProductImage.url, Banner.imageUrl, SellerProfile.logoUrl) can store.
router.post(
  '/image',
  protect,
  authorize('seller', 'admin'),
  uploadImage.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No image file was provided (field name must be "image")');
    sendSuccess(res, { statusCode: 201, data: { url: `/uploads/${req.file.filename}` }, message: 'Image uploaded' });
  })
);

module.exports = router;
