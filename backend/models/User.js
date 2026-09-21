const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },

  passwordHash: {
    type: String,
    required: true,
    select: false,
  },

  role: {
    type: String,
    enum: ["customer", "seller", "admin"],
    default: "customer",
  },

  preferredLanguage: {
    type: String,
    enum: ["ar", "en"],
    default: "en",
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  isEmailVerified: {
    type: Boolean,
    default: false,
  },

  emailVerificationCodeHash: {
    type: String,
    select: false,
  },

  emailVerificationExpiresAt: {
    type: Date,
    select: false,
  },

  /* =====================================================
   PASSWORD RESET OTP
===================================================== */

  passwordResetOtpHash: {
    type: String,
    select: false,
  },

  passwordResetOtpExpiresAt: {
    type: Date,
    select: false,
  },

  passwordResetOtpSentAt: {
    type: Date,
    select: false,
  },

  passwordResetVerifiedTokenHash: {
    type: String,
    select: false,
  },

  passwordResetVerifiedExpiresAt: {
    type: Date,
    select: false,
  },
});

module.exports = mongoose.model("User", userSchema);
