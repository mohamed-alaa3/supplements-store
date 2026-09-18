const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/protect');
const { authLimiter } = require('../middlewares/rateLimit');
const {
  registerRules, loginRules, changePasswordRules, updateProfileRules, verifyEmailRules, resendVerificationRules
} = require('../validators/auth.validators');

router.post('/register', authLimiter, registerRules, validate, ctrl.register);
router.post('/verify-email', authLimiter, verifyEmailRules, validate, ctrl.verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationRules, validate, ctrl.resendVerification);
router.post('/login', authLimiter, loginRules, validate, ctrl.login);
router.get('/me', protect, ctrl.getMe);
router.patch('/me', protect, updateProfileRules, validate, ctrl.updateMe);
router.patch('/change-password', protect, changePasswordRules, validate, ctrl.changePassword);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, ctrl.resetPassword);

module.exports = router;
