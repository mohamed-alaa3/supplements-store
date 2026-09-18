/**
 * Thrown from controllers/services for expected failure cases
 * (validation, not found, forbidden, conflict...). The global error handler
 * knows how to turn this into the standard { success:false } envelope.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isApiError = true;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, errors) { return new ApiError(400, message, errors); }
  static unauthorized(message = 'Authentication required') { return new ApiError(401, message); }
  static forbidden(message = 'You are not authorized to do that') { return new ApiError(403, message); }
  static notFound(message = 'Resource not found') { return new ApiError(404, message); }
  static conflict(message = 'Conflict') { return new ApiError(409, message); }
}

module.exports = ApiError;
