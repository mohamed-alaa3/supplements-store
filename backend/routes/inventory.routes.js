const router = require('express').Router();
const ctrl = require('../controllers/inventory.controller');
const { protect } = require('../middlewares/protect');
const authorize = require('../middlewares/authorize');

router.get('/variant/:variantId', protect, authorize('seller', 'admin'), ctrl.getForVariant);
router.patch('/variant/:variantId', protect, authorize('seller', 'admin'), ctrl.updateForVariant);

module.exports = router;
