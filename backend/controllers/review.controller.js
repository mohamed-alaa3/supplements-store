const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { round2 } = require('../services/pricing.service');

/**
 * Recomputes Product.ratingAverage/reviewCount from approved reviews only.
 * This is the ONLY place those two fields are written — controllers must
 * never set them directly (product.controller.update strips them from the
 * request body for exactly this reason).
 */
async function recomputeProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const { avg = 0, count = 0 } = stats[0] || {};
  await Product.findByIdAndUpdate(productId, { ratingAverage: round2(avg), reviewCount: count });
}

// GET /api/products/:id/reviews
const listForProduct = asyncHandler(async (req, res) => {
  const filter = { product: req.params.id, status: 'approved' };
  const reviews = await Review.find(filter).sort({ createdAt: -1 }).populate('user', 'fullName');
  sendSuccess(res, { data: reviews });
});

// POST /api/products/:id/reviews
const create = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await Review.findOne({ user: req.user._id, product: product._id });
  if (existing) throw ApiError.conflict('You have already reviewed this product');

  const review = await Review.create({
    user: req.user._id, product: product._id, order: req.body.order,
    rating: req.body.rating, title: req.body.title, comment: req.body.comment,
    status: 'pending'
  });

  sendSuccess(res, { statusCode: 201, data: review, message: 'Review submitted for moderation' });
});

// PATCH /api/reviews/:id
const update = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') throw ApiError.forbidden();

  const { rating, title, comment } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  if (req.user.role !== 'admin') review.status = 'pending'; // edits by the author re-enter moderation

  await review.save();
  if (review.status === 'approved') await recomputeProductRating(review.product);

  sendSuccess(res, { data: review, message: 'Review updated' });
});

// DELETE /api/reviews/:id
const remove = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') throw ApiError.forbidden();

  const wasApproved = review.status === 'approved';
  const productId = review.product;
  await review.deleteOne();
  if (wasApproved) await recomputeProductRating(productId);

  sendSuccess(res, { data: null, message: 'Review removed' });
});

// ---- Admin moderation -----------------------------------------------------

const adminQueue = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ status: 'pending' }).sort({ createdAt: 1 }).populate('user', 'fullName');
  sendSuccess(res, { data: reviews });
});

const adminSetStatus = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  review.status = req.body.status;
  await review.save();
  await recomputeProductRating(review.product);

  sendSuccess(res, { data: review, message: 'Review status updated' });
});

module.exports = { listForProduct, create, update, remove, adminQueue, adminSetStatus, recomputeProductRating };
