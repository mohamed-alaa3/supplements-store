const router = require('express').Router();
const ctrl = require('../controllers/brand.controller');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/protect');
const authorize = require('../middlewares/authorize');
const { brandRules, brandUpdateRules } = require('../validators/catalog.validators');

router.get('/', ctrl.list);
router.get('/:slug', ctrl.getBySlug);
router.post('/', protect, authorize('admin'), brandRules, validate, ctrl.create);
router.patch('/:id', protect, authorize('admin'), brandUpdateRules, validate, ctrl.update);
router.delete('/:id', protect, authorize('admin'), ctrl.remove);

module.exports = router;
