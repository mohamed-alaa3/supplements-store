const { body } = require('express-validator');

const registerRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().isString()
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const changePasswordRules = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

const updateProfileRules = [
  body('fullName').optional().trim().notEmpty(),
  body('phone').optional().isString(),
  body('preferredLanguage').optional().isIn(['ar', 'en'])
];

const verifyEmailRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('code').trim().notEmpty().withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
    .isNumeric().withMessage('Code must contain only numbers')
];

const resendVerificationRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail()
];
const forgotPasswordRules = [
  body("email")
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
];

const verifyResetOtpRules = [
  body("email")
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),

  body("code")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Code must be 6 digits")
    .isNumeric()
    .withMessage("Code must contain only numbers"),
];

const resendResetOtpRules = [
  body("email")
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
];

const resetPasswordRules = [
  body("resetToken").trim().notEmpty().withMessage("Reset token is required"),

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
];

module.exports = {
  registerRules,
  loginRules,
  changePasswordRules,
  updateProfileRules,
  verifyEmailRules,
  resendVerificationRules,

  forgotPasswordRules,
  verifyResetOtpRules,
  resendResetOtpRules,
  resetPasswordRules,
};