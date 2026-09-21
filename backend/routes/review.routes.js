const router = require('express').Router();
const ctrl = require('../controllers/review.controller');
const { protect } = require('../middlewares/protect');

router.patch('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
