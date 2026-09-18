const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const Product = require('../models/Product');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Inventory = require('../models/Inventory');

// GET /api/admin/overview
const getOverview = asyncHandler(async (req, res) => {
  const [productsCount, usersCount, sellersCount, ordersCount, pendingReviewsCount, lowStockVariantsCount] =
    await Promise.all([
      Product.countDocuments({ isActive: true }),
      User.countDocuments(),
      SellerProfile.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Inventory.countDocuments({ status: 'low_stock' })
    ]);

  sendSuccess(res, {
    data: { productsCount, usersCount, sellersCount, ordersCount, pendingReviewsCount, lowStockVariantsCount }
  });
});

module.exports = { getOverview };
