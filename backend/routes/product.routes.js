const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const variantCtrl = require('../controllers/variant.controller');
const reviewCtrl = require('../controllers/review.controller');
const validate = require('../middlewares/validate');
const { protect, optionalAuth } = require('../middlewares/protect');
const authorize = require('../middlewares/authorize');
const { ownsResource } = require('../middlewares/ownership');
const { productRules, productUpdateRules, variantRules } = require('../validators/product.validators');
const { reviewRules } = require('../validators/review.validators');

// Public reads
router.get('/', ctrl.list);
router.get('/slug/:slug', ctrl.getBySlug);
router.get('/:id', ctrl.getById);
router.get('/:productId/images', ctrl.getImages);
router.get('/:id/reviews', reviewCtrl.listForProduct);
router.get('/:productId/variants', variantCtrl.listForProduct);

// Seller/Admin writes
router.post('/', protect, authorize('seller', 'admin'), productRules, validate, ctrl.create);
router.patch('/:id', protect, authorize('seller', 'admin'), ownsResource(ctrl.loadProductForOwnership), productUpdateRules, validate, ctrl.update);
router.delete('/:id', protect, authorize('seller', 'admin'), ownsResource(ctrl.loadProductForOwnership), ctrl.remove);
const { body } = require('express-validator');
router.patch('/:id/status', protect, authorize('admin'), body('isActive').isBoolean(), validate, ctrl.setStatus);

router.post('/:productId/images', protect, authorize('seller', 'admin'), ownsResource((req) => ctrl.loadProductForOwnership({ params: { id: req.params.productId } })), ctrl.addImage);
router.delete('/:productId/images/:imageId', protect, authorize('seller', 'admin'), ownsResource((req) => ctrl.loadProductForOwnership({ params: { id: req.params.productId } })), ctrl.deleteImage);

router.post('/:productId/variants', protect, authorize('seller', 'admin'), variantRules, validate, variantCtrl.create);

// Reviews (customer)
router.post('/:id/reviews', protect, authorize('customer'), reviewRules, validate, reviewCtrl.create);

module.exports = router;
