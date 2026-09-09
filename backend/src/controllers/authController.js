const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncWrapper');
const generateToken = require('../utils/token');
const { z } = require('zod');

// Input Validation Schemas using Zod
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map((e) => e.message).join(', ');
    return ApiResponse.error(res, errorMessages, 400);
  }

  const { name, email, password, currency } = validation.data;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return ApiResponse.error(res, 'An account with this email address already exists', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'user',
    currency: currency || 'INR',
  });

  const token = generateToken(user._id);

  return ApiResponse.success(
    res,
    {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        currency: user.currency,
        createdAt: user.createdAt,
      },
    },
    'User registered successfully',
    201
  );
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map((e) => e.message).join(', ');
    return ApiResponse.error(res, errorMessages, 400);
  }

  const { email, password } = validation.data;

  // Fetch user including password field for verification
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return ApiResponse.error(res, 'Invalid credentials', 401);
  }

  if (!user.isActive) {
    return ApiResponse.error(res, 'Account has been disabled. Please contact administrator', 403);
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return ApiResponse.error(res, 'Invalid credentials', 401);
  }

  const token = generateToken(user._id);

  return ApiResponse.success(
    res,
    {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        currency: user.currency,
        createdAt: user.createdAt,
      },
    },
    'Login successful'
  );
});

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  return ApiResponse.success(res, { user }, 'User profile fetched successfully');
});

/**
 * @desc    Update profile details
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, currency, avatar } = req.body;

  const fieldsToUpdate = {};
  if (name) fieldsToUpdate.name = name;
  if (currency) fieldsToUpdate.currency = currency;
  if (avatar !== undefined) fieldsToUpdate.avatar = avatar;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  }).select('-password');

  return ApiResponse.success(res, { user: updatedUser }, 'Profile updated successfully');
});

/**
 * @desc    Logout user / clear token on client
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logoutUser = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, null, 'Logged out successfully');
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  logoutUser,
};
