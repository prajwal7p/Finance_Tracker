const Category = require('../models/Category');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncWrapper');
const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(30),
  type: z.enum(['income', 'expense', 'both']),
  icon: z.string().optional(),
  color: z.string().optional(),
});

/**
 * @desc    Get all available categories (System default + User custom)
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({
    $or: [{ isDefault: true }, { createdBy: req.user._id }],
  }).sort({ isDefault: -1, name: 1 });

  return ApiResponse.success(res, categories, 'Categories retrieved successfully');
});

/**
 * @desc    Create a custom category
 * @route   POST /api/categories
 * @access  Private
 */
const createCategory = asyncHandler(async (req, res) => {
  const validation = categorySchema.safeParse(req.body);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map((e) => e.message).join(', ');
    return ApiResponse.error(res, errorMessages, 400);
  }

  const { name, type, icon, color } = validation.data;

  // Check duplicate category name for this user
  const existing = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    $or: [{ isDefault: true }, { createdBy: req.user._id }],
  });

  if (existing) {
    return ApiResponse.error(res, 'Category with this name already exists', 409);
  }

  const category = await Category.create({
    name,
    type,
    icon: icon || 'Tag',
    color: color || '#6366f1',
    isDefault: false,
    createdBy: req.user._id,
  });

  return ApiResponse.success(res, category, 'Custom category created successfully', 201);
});

module.exports = {
  getCategories,
  createCategory,
};
