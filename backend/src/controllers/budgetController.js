const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncWrapper');
const mongoose = require('mongoose');
const { z } = require('zod');

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.number().gt(0, 'Target amount must be greater than 0'),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
});

/**
 * @desc    Create a new budget for category/month/year
 * @route   POST /api/budgets
 * @access  Private
 */
const createBudget = asyncHandler(async (req, res) => {
  const validation = budgetSchema.safeParse({
    ...req.body,
    amount: Number(req.body.amount),
    month: Number(req.body.month),
    year: Number(req.body.year),
  });

  if (!validation.success) {
    const errorMessages = validation.error.errors.map((e) => e.message).join(', ');
    return ApiResponse.error(res, errorMessages, 400);
  }

  const { categoryId, amount, month, year } = validation.data;

  // Check category
  const category = await Category.findById(categoryId);
  if (!category) {
    return ApiResponse.error(res, 'Selected category does not exist', 400);
  }

  // Pre-check for duplicate budget
  const existingBudget = await Budget.findOne({
    userId: req.user._id,
    categoryId,
    month,
    year,
  });

  if (existingBudget) {
    return ApiResponse.error(
      res,
      'A budget for this category, month, and year already exists',
      409
    );
  }

  const budget = await Budget.create({
    userId: req.user._id,
    categoryId,
    amount,
    month,
    year,
  });

  const populated = await Budget.findById(budget._id).populate('categoryId', 'name type icon color');

  return ApiResponse.success(res, populated, 'Budget created successfully', 201);
});

/**
 * @desc    Get user budgets with calculated spending for given month & year
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudgets = asyncHandler(async (req, res) => {
  const currentDate = new Date();
  const month = parseInt(req.query.month, 10) || currentDate.getMonth() + 1;
  const year = parseInt(req.query.year, 10) || currentDate.getFullYear();

  // Find all budgets for this user for month/year
  const budgets = await Budget.find({
    userId: req.user._id,
    month,
    year,
  }).populate('categoryId', 'name type icon color');

  // Calculate start and end date for month query
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Aggregate transaction expenses per category for user in month
  const spendingAggregation = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.user._id),
        type: 'expense',
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$categoryId',
        totalSpent: { $sum: '$amount' },
      },
    },
  ]);

  // Map category spending
  const spendingMap = {};
  spendingAggregation.forEach((item) => {
    spendingMap[item._id.toString()] = item.totalSpent;
  });

  // Calculate progress for each budget
  const budgetListWithUtilization = budgets.map((budget) => {
    const categoryIdStr = budget.categoryId?._id ? budget.categoryId._id.toString() : budget.categoryId.toString();
    const spent = spendingMap[categoryIdStr] || 0;
    const targetAmount = budget.amount;
    const remaining = Math.max(0, targetAmount - spent);
    const percentageUsed = targetAmount > 0 ? Math.min(100, Math.round((spent / targetAmount) * 100 * 100) / 100) : 0;
    const rawPercentage = targetAmount > 0 ? (spent / targetAmount) * 100 : 0;
    const isExceeded = spent > targetAmount;

    return {
      _id: budget._id,
      userId: budget.userId,
      category: budget.categoryId,
      amount: targetAmount,
      month: budget.month,
      year: budget.year,
      spent,
      remaining,
      percentageUsed,
      rawPercentage,
      isExceeded,
      excessAmount: isExceeded ? spent - targetAmount : 0,
      createdAt: budget.createdAt,
    };
  });

  return ApiResponse.success(
    res,
    budgetListWithUtilization,
    'Budgets retrieved with calculated spending'
  );
});

/**
 * @desc    Update budget amount
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
const updateBudget = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) {
    return ApiResponse.error(res, 'Amount must be greater than 0', 400);
  }

  const budget = await Budget.findById(req.params.id);
  if (!budget) {
    return ApiResponse.error(res, 'Budget not found', 404);
  }

  if (budget.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Forbidden: You cannot modify this budget', 403);
  }

  budget.amount = Number(amount);
  await budget.save();

  const updated = await Budget.findById(budget._id).populate('categoryId', 'name type icon color');
  return ApiResponse.success(res, updated, 'Budget updated successfully');
});

/**
 * @desc    Delete budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);
  if (!budget) {
    return ApiResponse.error(res, 'Budget not found', 404);
  }

  if (budget.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Forbidden: You cannot delete this budget', 403);
  }

  await budget.deleteOne();
  return ApiResponse.success(res, { id: req.params.id }, 'Budget deleted successfully');
});

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};
