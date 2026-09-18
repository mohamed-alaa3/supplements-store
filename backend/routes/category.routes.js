const router = require('express').Router();
const ctrl = require('../controllers/category.controller');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/protect');
const authorize = require('../middlewares/authorize');
const { categoryRules, categoryUpdateRules } = require('../validators/catalog.validators');

router.get('/', ctrl.list);
router.get('/:slug', ctrl.getBySlug);
router.post('/', protect, authorize('admin'), categoryRules, validate, ctrl.create);
router.patch('/:id', protect, authorize('admin'), categoryUpdateRules, validate, ctrl.update);
router.delete('/:id', protect, authorize('admin'), ctrl.remove);

module.exports = router;
