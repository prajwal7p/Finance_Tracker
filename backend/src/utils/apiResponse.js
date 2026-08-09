/**
 * Standardized API Response Helper
 */
class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, meta = undefined) {
    const payload = {
      success: true,
      message,
      data,
    };
    if (meta !== undefined) {
      payload.meta = meta;
    }
    return res.status(statusCode).json(payload);
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const payload = {
      success: false,
      message,
    };
    if (errors) {
      payload.errors = errors;
    }
    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
