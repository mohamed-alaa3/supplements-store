const router = require('express').Router();
const ctrl = require('../controllers/variant.controller');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/protect');
const authorize = require('../middlewares/authorize');
const { variantUpdateRules } = require('../validators/product.validators');

router.patch('/:variantId', protect, authorize('seller', 'admin'), variantUpdateRules, validate, ctrl.update);
router.delete('/:variantId', protect, authorize('seller', 'admin'), ctrl.remove);

module.exports = router;
