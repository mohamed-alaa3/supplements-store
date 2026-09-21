const router = require('express').Router();
const ctrl = require('../controllers/banner.controller');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/protect');
const authorize = require('../middlewares/authorize');
const { bannerRules, bannerUpdateRules } = require('../validators/banner.validators');

router.get('/', ctrl.list);
router.post('/', protect, authorize('admin'), bannerRules, validate, ctrl.create);
router.patch('/:id', protect, authorize('admin'), bannerUpdateRules, validate, ctrl.update);
router.delete('/:id', protect, authorize('admin'), ctrl.remove);

module.exports = router;
