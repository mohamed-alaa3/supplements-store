const router = require('express').Router();
const ctrl = require('../controllers/seller.controller');
const { protect } = require('../middlewares/protect');
const authorize = require('../middlewares/authorize');

router.get('/', ctrl.listActiveSellers);
router.post('/apply', protect, ctrl.apply);
router.get('/me', protect, authorize('seller'), ctrl.getMyProfile);
router.patch('/me', protect, authorize('seller'), ctrl.updateMyProfile);
router.get('/:id', ctrl.getSellerStorefront);

module.exports = router;
