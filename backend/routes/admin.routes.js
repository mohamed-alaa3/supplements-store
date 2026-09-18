// Everything under /api/admin/* requires an authenticated admin.
const router = require('express').Router();
const { protect } = require('../middlewares/protect');
const authorize = require('../middlewares/authorize');

const userCtrl = require('../controllers/user.controller');
const sellerCtrl = require('../controllers/seller.controller');
const inventoryCtrl = require('../controllers/inventory.controller');
const couponCtrl = require('../controllers/coupon.controller');
const orderCtrl = require('../controllers/order.controller');
const reviewCtrl = require('../controllers/review.controller');
const adminCtrl = require('../controllers/admin.controller');
const validate = require('../middlewares/validate');
const { couponRules } = require('../validators/coupon.validators');
const {
  orderStatusRules, sellerStatusRules, userStatusRules, userRoleRules, reviewStatusRules
} = require('../validators/status.validators');

router.use(protect, authorize('admin'));

router.get('/overview', adminCtrl.getOverview);

router.get('/users', userCtrl.adminListUsers);
router.patch('/users/:id/status', userStatusRules, validate, userCtrl.adminSetUserStatus);
router.patch('/users/:id/role', userRoleRules, validate, userCtrl.adminSetUserRole);

router.patch('/sellers/:id/status', sellerStatusRules, validate, sellerCtrl.adminSetSellerStatus);

router.get('/inventory', inventoryCtrl.adminOverview);
router.post('/inventory/adjustments', inventoryCtrl.adminAdjust);

router.get('/coupons', couponCtrl.adminList);
router.post('/coupons', couponRules, validate, couponCtrl.adminCreate);
router.patch('/coupons/:id', couponCtrl.adminUpdate);
router.delete('/coupons/:id', couponCtrl.adminDeactivate);

router.get('/orders', orderCtrl.adminList);
router.patch('/orders/:id/status', orderStatusRules, validate, orderCtrl.adminUpdateStatus);

router.get('/reviews', reviewCtrl.adminQueue);
router.patch('/reviews/:id/status', reviewStatusRules, validate, reviewCtrl.adminSetStatus);

module.exports = router;
