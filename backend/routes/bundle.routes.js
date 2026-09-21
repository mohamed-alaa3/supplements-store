const router = require('express').Router();
const ctrl = require('../controllers/bundle.controller');
const { protect } = require('../middlewares/protect');
const authorize = require('../middlewares/authorize');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/:id/validate', ctrl.validateSelection);
router.post('/:id/quote', ctrl.quote);
router.post('/:id/add-to-cart', protect, ctrl.addToCart);

router.post('/', protect, authorize('seller', 'admin'), ctrl.create);
router.patch('/:id', protect, authorize('seller', 'admin'), ctrl.update);
router.delete('/:id', protect, authorize('seller', 'admin'), ctrl.remove);

module.exports = router;
