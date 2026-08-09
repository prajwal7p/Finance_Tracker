const RecurringTransaction = require('../models/RecurringTransaction');
const Category = require('../models/Category');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncWrapper');
const { calculateNextDate, processDueRecurringTransactions } = require('../services/recurringService');
const { z } = require('zod');

const recurringSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(200),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
});

/**
 * @desc    Create recurring transaction configuration
 * @route   POST /api/recurring
 * @access  Private
 */
const createRecurring = asyncHandler(async (req, res) => {
  const validation = recurringSchema.safeParse({
    ...req.body,
    amount: Number(req.body.amount),
  });

  if (!validation.success) {
    const errorMessages = validation.error.errors.map((e) => e.message).join(', ');
    return ApiResponse.error(res, errorMessages, 400);
  }

  const { type, amount, categoryId, description, frequency, startDate, endDate } = validation.data;

  const category = await Category.findById(categoryId);
  if (!category) {
    return ApiResponse.error(res, 'Selected category does not exist', 400);
  }

  const start = startDate ? new Date(startDate) : new Date();
  const nextDate = calculateNextDate(start, frequency);

  const recurring = await RecurringTransaction.create({
    userId: req.user._id,
    type,
    amount,
    categoryId,
    description,
    frequency,
    startDate: start,
    nextDate,
    endDate: endDate ? new Date(endDate) : null,
    isActive: true,
  });

  const populated = await RecurringTransaction.findById(recurring._id).populate('categoryId', 'name type icon color');
  return ApiResponse.success(res, populated, 'Recurring schedule created successfully', 201);
});

/**
 * @desc    Get user recurring transactions
 * @route   GET /api/recurring
 * @access  Private
 */
const getRecurring = asyncHandler(async (req, res) => {
  // Trigger due recurring items check automatically when fetching list
  await processDueRecurringTransactions();

  const items = await RecurringTransaction.find({ userId: req.user._id })
    .populate('categoryId', 'name type icon color')
    .sort({ nextDate: 1 });

  return ApiResponse.success(res, items, 'Recurring transactions retrieved successfully');
});

/**
 * @desc    Toggle active status of recurring item
 * @route   PATCH /api/recurring/:id/toggle
 * @access  Private
 */
const toggleRecurringStatus = asyncHandler(async (req, res) => {
  const recurring = await RecurringTransaction.findById(req.params.id);

  if (!recurring) {
    return ApiResponse.error(res, 'Recurring schedule not found', 404);
  }

  if (recurring.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Forbidden: You cannot modify this schedule', 403);
  }

  recurring.isActive = !recurring.isActive;
  await recurring.save();

  const updated = await RecurringTransaction.findById(recurring._id).populate('categoryId', 'name type icon color');
  return ApiResponse.success(res, updated, `Schedule ${recurring.isActive ? 'activated' : 'paused'} successfully`);
});

/**
 * @desc    Delete recurring schedule
 * @route   DELETE /api/recurring/:id
 * @access  Private
 */
const deleteRecurring = asyncHandler(async (req, res) => {
  const recurring = await RecurringTransaction.findById(req.params.id);

  if (!recurring) {
    return ApiResponse.error(res, 'Recurring schedule not found', 404);
  }

  if (recurring.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Forbidden: You cannot delete this schedule', 403);
  }

  await recurring.deleteOne();
  return ApiResponse.success(res, { id: req.params.id }, 'Recurring schedule deleted successfully');
});

module.exports = {
  createRecurring,
  getRecurring,
  toggleRecurringStatus,
  deleteRecurring,
};
