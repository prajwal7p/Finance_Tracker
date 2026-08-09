const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('./asyncWrapper');

/**
 * Protect middleware - Enforces JWT authentication
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.error(res, 'Not authorized, token missing', 401);
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fintrack_dev_secret_key_987654321'
    );

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return ApiResponse.error(res, 'User no longer exists', 401);
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 'User account has been disabled', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Not authorized, token verification failed', 401);
  }
});

/**
 * Role-based authorization middleware (RBAC)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `User role '${req.user.role}' is not authorized to access this route`,
        403
      );
    }

    next();
  };
};

module.exports = { protect, authorize };
