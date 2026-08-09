const ApiResponse = require('../utils/apiResponse');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details for server diagnostics
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error Handler]', err);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return ApiResponse.error(res, message, 404);
  }

  // Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    return ApiResponse.error(res, message, 409);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return ApiResponse.error(res, message, 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid authentication token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Authentication token expired', 401);
  }

  const statusCode = error.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = error.message || 'Internal Server Error';

  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorHandler;
