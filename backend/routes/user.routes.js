const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/protect');
const { addressRules } = require('../validators/address.validators');

router.get('/me', protect, ctrl.getMe);
router.get('/me/addresses', protect, ctrl.listAddresses);
router.post('/me/addresses', protect, addressRules, validate, ctrl.createAddress);
router.patch('/me/addresses/:id', protect, ctrl.updateAddress);
router.delete('/me/addresses/:id', protect, ctrl.deleteAddress);
router.patch('/me/addresses/:id/default', protect, ctrl.setDefaultAddress);

module.exports = router;
