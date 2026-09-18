const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');

const { sendVerificationEmail } = require('../services/email.service');

const SALT_ROUNDS = 10;

/** Generate a cryptographically secure 6-digit code */
function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

/** Hash a verification code for secure storage */
function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ fullName, email, phone, passwordHash, role: 'customer' });

  const code = generateVerificationCode();
  user.emailVerificationCodeHash = hashCode(code);
  user.emailVerificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

await sendVerificationEmail(user.email, code, user.preferredLanguage);

  const token = generateToken(user);
  sendSuccess(res, { statusCode: 201, data: { user: sanitize(user), token, requiresVerification: true }, message: 'Account created' });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash",
  );

  if (!user) throw ApiError.unauthorized("Invalid email or password");

  if (!user.isActive) {
    throw ApiError.forbidden("This account has been deactivated");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Require email verification before login
  if (!user.isEmailVerified) {
    throw ApiError.forbidden("Please verify your email before logging in");
  }

  const token = generateToken(user);

  sendSuccess(res, {
    data: {
      user: sanitize(user),
      token,
    },
    message: "Logged in",
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: sanitize(req.user) });
});

// PATCH /api/auth/me
const updateMe = asyncHandler(async (req, res) => {
  const { fullName, phone, preferredLanguage } = req.body;
  const user = req.user;

  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;

  await user.save();
  sendSuccess(res, { data: sanitize(user), message: 'Profile updated' });
});

// PATCH /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
  sendSuccess(res, { data: null, message: 'Password changed' });
});

// POST /api/auth/forgot-password
// NOTE: issues a reset token but does not send a real email — no SMTP
// credentials are configured in this environment. Wire an email provider
// (e.g. nodemailer) in production; the token/flow below is fully functional.
const resetTokens = new Map(); // In-memory only — replace with a persisted, hashed, expiring token store in production.

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() });
  // Always respond the same way whether or not the email exists, to avoid account enumeration.
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, { userId: user._id.toString(), expiresAt: Date.now() + 30 * 60 * 1000 });
  }
  sendSuccess(res, { data: null, message: 'If that email exists, a reset link has been generated' });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const entry = resetTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) throw ApiError.badRequest('Invalid or expired reset token');

  const user = await User.findById(entry.userId);
  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
  resetTokens.delete(token);

  sendSuccess(res, { data: null, message: 'Password reset' });
});

function sanitize(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// POST /api/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+emailVerificationCodeHash +emailVerificationExpiresAt');
  if (!user) throw ApiError.badRequest('Invalid verification request');
  
  if (user.isEmailVerified) throw ApiError.badRequest('Email is already verified');
  
  if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
    throw ApiError.badRequest('No verification code found. Please request a new one');
  }
  
  if (user.emailVerificationExpiresAt < new Date()) {
    throw ApiError.badRequest('Verification code has expired. Please request a new one');
  }
  
  const codeHash = hashCode(code);
  if (codeHash !== user.emailVerificationCodeHash) {
    throw ApiError.badRequest('Invalid verification code');
  }
  
  user.isEmailVerified = true;
  user.emailVerificationCodeHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();
  
  sendSuccess(res, { data: { verified: true }, message: 'Email verified successfully' });
});

// POST /api/auth/resend-verification
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+emailVerificationExpiresAt');
  if (!user) throw ApiError.badRequest('Account not found');
  
  if (user.isEmailVerified) throw ApiError.badRequest('Email is already verified');
  
  // Cooldown: prevent resend if last code was sent less than 60 seconds ago
  if (user.emailVerificationExpiresAt) {
    const lastSentAt = new Date(user.emailVerificationExpiresAt.getTime() - 10 * 60 * 1000);
    const cooldownEnd = new Date(lastSentAt.getTime() + 60 * 1000);
    if (new Date() < cooldownEnd) {
      throw ApiError.badRequest('Please wait before requesting a new code');
    }
  }
  
  const code = generateVerificationCode();
  user.emailVerificationCodeHash = hashCode(code);
  user.emailVerificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  
await sendVerificationEmail(user.email, code, user.preferredLanguage);
  
  sendSuccess(res, { data: null, message: 'Verification code sent' });
});

module.exports = { register, login, getMe, updateMe, changePassword, forgotPassword, resetPassword, verifyEmail, resendVerification };
