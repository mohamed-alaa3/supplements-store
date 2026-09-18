const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/protect');
const { createOrderRules, cancelOrderRules } = require('../validators/order.validators');

router.use(protect);
router.post('/', createOrderRules, validate, ctrl.create);
router.get('/me', ctrl.myOrders);
router.get('/:id', ctrl.getById);
router.post('/:id/cancel', cancelOrderRules, validate, ctrl.cancel);

module.exports = router;
