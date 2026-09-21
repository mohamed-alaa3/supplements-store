const router = require('express').Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/sellers', require('./seller.routes'));
router.use('/seller', require('./sellerScoped.routes'));
router.use('/brands', require('./brand.routes'));
router.use('/categories', require('./category.routes'));
router.use('/products', require('./product.routes'));
router.use('/variants', require('./variant.routes'));
router.use('/inventory', require('./inventory.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/wishlist', require('./wishlist.routes'));
router.use('/bundles', require('./bundle.routes'));
router.use('/coupons', require('./coupon.routes'));
router.use('/orders', require('./order.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/banners', require('./banner.routes'));
router.use('/uploads', require('./upload.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
