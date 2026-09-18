const router = require('express').Router();
const ctrl = require('../controllers/coupon.controller');
const { protect } = require('../middlewares/protect');

router.post('/validate', protect, ctrl.validateAgainstCart);

module.exports = router;
