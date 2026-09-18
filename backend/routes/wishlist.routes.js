const router = require('express').Router();
const ctrl = require('../controllers/wishlist.controller');
const { protect } = require('../middlewares/protect');

router.use(protect);
router.get('/', ctrl.getWishlist);
router.post('/items', ctrl.addItem);
router.delete('/items/:itemId', ctrl.removeItem);
router.delete('/', ctrl.clear);

module.exports = router;
