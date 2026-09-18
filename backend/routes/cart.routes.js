const router = require('express').Router();
const ctrl = require('../controllers/cart.controller');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/protect');
const { addCartItemRules, updateCartItemRules, applyCouponRules } = require('../validators/cart.validators');

router.use(protect);
router.get('/', ctrl.getCart);
router.post('/items', addCartItemRules, validate, ctrl.addItem);
router.patch('/items/:itemId', updateCartItemRules, validate, ctrl.updateItem);
router.delete('/items/:itemId', ctrl.removeItem);
router.delete('/', ctrl.clearCart);
router.post('/apply-coupon', applyCouponRules, validate, ctrl.applyCoupon);
router.delete('/coupon', ctrl.removeCoupon);

module.exports = router;
