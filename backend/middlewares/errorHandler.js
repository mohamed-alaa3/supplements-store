const env = require('../config/env');

/**
 * Centralized error handler — last middleware in the chain. Normalizes
 * ApiError, Mongoose validation/cast errors, JSON parse errors and duplicate
 * key (11000) errors into the standard { success:false, message, errors? }
 * envelope. Never leaks a raw stack trace to the client.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors && !err.isApiError) {
    // Mongoose schema validation error
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already in use` : 'Duplicate value';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON body';
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
    if (env.isProduction) message = 'Internal server error';
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
}

module.exports = errorHandler;
