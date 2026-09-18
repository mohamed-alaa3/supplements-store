const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const User = require('../models/User');

/**
 * Verifies the `Authorization: Bearer <token>` header, loads the user, and
 * attaches it to req.user. Rejects if the token is missing/invalid/expired
 * or the user has been deactivated.
 */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  req.user = user;
  next();
});

/** Like `protect`, but does not fail when no token is present — req.user stays undefined. */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next();

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);
    if (user && user.isActive) req.user = user;
  } catch {
    // Ignore invalid tokens on optional routes.
  }
  next();
});

module.exports = { protect, optionalAuth };
