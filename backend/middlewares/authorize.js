const ApiError = require('../utils/ApiError');

/**
 * Role gate — use after `protect`. Usage: authorize('admin') or authorize('seller','admin').
 */
function authorize(...allowedRoles) {
  return function authorizeMiddleware(req, res, next) {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${allowedRoles.join(' or ')}`));
    }
    next();
  };
}

module.exports = authorize;
