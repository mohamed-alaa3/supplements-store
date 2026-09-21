const rateLimit = require('express-rate-limit');

/** Generic API limiter — generous, just to blunt abuse. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

/** Tighter limiter for auth endpoints (login/register/forgot-password) to slow brute force. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' }
});

module.exports = { apiLimiter, authLimiter };
