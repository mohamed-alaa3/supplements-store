const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');

const {
  sendVerificationEmail,
  sendPasswordResetOtpEmail,
} = require("../services/email.service");



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
// =========================================================
// FORGOT PASSWORD
// =========================================================

// =========================================================
// FORGOT PASSWORD - SEND OTP
// =========================================================

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select(
    "+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpSentAt"
  );

  /*
   * Always return the same response.
   * This prevents email/account enumeration.
   */

  if (user && user.isActive) {

    /*
     * Resend cooldown: 60 seconds
     */
    if (
      user.passwordResetOtpSentAt &&
      Date.now() - user.passwordResetOtpSentAt.getTime() < 60 * 1000
    ) {
      sendSuccess(res, {
        data: null,
        message:
          "If that email exists, a password reset code has been sent",
      });
      return;
    }

    // Generate secure 6-digit OTP
    const code = generateVerificationCode();

    // Hash OTP before storing
    user.passwordResetOtpHash = hashCode(code);

    // OTP expires after 10 minutes
    user.passwordResetOtpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // Used for resend cooldown
    user.passwordResetOtpSentAt = new Date();

    // Clear any previous verified reset session
    user.passwordResetVerifiedTokenHash = undefined;
    user.passwordResetVerifiedExpiresAt = undefined;

    await user.save();

    // Send OTP via Gmail
    await sendPasswordResetOtpEmail(
      user.email,
      code,
      user.preferredLanguage
    );
  }

  sendSuccess(res, {
    data: null,
    message:
      "If that email exists, a password reset code has been sent",
  });
});


// =========================================================
// VERIFY PASSWORD RESET OTP
// =========================================================

const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedCode = String(code).trim();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select(
    "+passwordResetOtpHash +passwordResetOtpExpiresAt"
  );

  if (!user) {
    throw ApiError.badRequest("Invalid or expired verification code");
  }

  if (!user.isActive) {
    throw ApiError.forbidden(
      "This account has been deactivated"
    );
  }

  if (
    !user.passwordResetOtpHash ||
    !user.passwordResetOtpExpiresAt
  ) {
    throw ApiError.badRequest(
      "No reset code found. Please request a new code"
    );
  }

  if (user.passwordResetOtpExpiresAt < new Date()) {
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;

    await user.save();

    throw ApiError.badRequest(
      "The verification code has expired. Please request a new code"
    );
  }

  const codeHash = hashCode(normalizedCode);

  if (codeHash !== user.passwordResetOtpHash) {
    throw ApiError.badRequest(
      "Invalid verification code"
    );
  }

  /*
   * OTP is correct.
   *
   * Generate a temporary verified token.
   * This token allows the next reset-password request
   * without exposing the OTP again.
   */

  const verifiedToken = crypto.randomBytes(32).toString("hex");

  const verifiedTokenHash = crypto
    .createHash("sha256")
    .update(verifiedToken)
    .digest("hex");

  user.passwordResetVerifiedTokenHash = verifiedTokenHash;

  /*
   * The verified reset session is valid for 10 minutes.
   */
  user.passwordResetVerifiedExpiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

  /*
   * OTP can no longer be reused.
   */
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;

  await user.save();

  sendSuccess(res, {
    data: {
      resetToken: verifiedToken,
    },
    message: "Verification code verified successfully",
  });
});


// =========================================================
// RESET PASSWORD
// =========================================================

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    throw ApiError.badRequest(
      "Reset token and new password are required"
    );
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    passwordResetVerifiedTokenHash: tokenHash,
    passwordResetVerifiedExpiresAt: {
      $gt: new Date(),
    },
  }).select(
    "+passwordHash +passwordResetVerifiedTokenHash +passwordResetVerifiedExpiresAt"
  );

  if (!user) {
    throw ApiError.badRequest(
      "Invalid or expired password reset session"
    );
  }

  if (!user.isActive) {
    throw ApiError.forbidden(
      "This account has been deactivated"
    );
  }

  // Update password
  user.passwordHash = await bcrypt.hash(
    newPassword,
    SALT_ROUNDS
  );

  /*
   * Invalidate reset session immediately.
   */
  user.passwordResetVerifiedTokenHash = undefined;
  user.passwordResetVerifiedExpiresAt = undefined;

  await user.save();

  sendSuccess(res, {
    data: null,
    message: "Password reset successfully",
  });
});


// =========================================================
// RESEND PASSWORD RESET OTP
// =========================================================

const resendResetOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select(
    "+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpSentAt"
  );

  /*
   * Same response for existing/non-existing emails.
   */
  if (user && user.isActive) {

    /*
     * 60-second cooldown.
     */
    if (
      user.passwordResetOtpSentAt &&
      Date.now() - user.passwordResetOtpSentAt.getTime() < 60 * 1000
    ) {
      throw ApiError.badRequest(
        "Please wait before requesting another code"
      );
    }

    const code = generateVerificationCode();

    user.passwordResetOtpHash = hashCode(code);

    user.passwordResetOtpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    user.passwordResetOtpSentAt = new Date();

    /*
     * Invalidate any previous verified reset session.
     */
    user.passwordResetVerifiedTokenHash = undefined;
    user.passwordResetVerifiedExpiresAt = undefined;

    await user.save();

    await sendPasswordResetOtpEmail(
      user.email,
      code,
      user.preferredLanguage
    );
  }

  sendSuccess(res, {
    data: null,
    message: "If that email exists, a password reset code has been sent",
  });
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

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resendResetOtp,
  resetPassword,
  verifyEmail,
  resendVerification,
};