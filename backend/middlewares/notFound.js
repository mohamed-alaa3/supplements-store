const ApiError = require('../utils/ApiError');

/** Catches any request that didn't match a route. */
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
