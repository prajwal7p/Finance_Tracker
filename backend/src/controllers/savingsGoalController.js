const SavingsGoal = require('../models/SavingsGoal');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncWrapper');
const { z } = require('zod');

const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  targetAmount: z.number().gt(0, 'Target amount must be greater than 0'),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().or(z.date()),
  description: z.string().max(300).optional(),
});

/**
 * @desc    Create a new savings goal
 * @route   POST /api/savings-goals
 * @access  Private
 */
const createSavingsGoal = asyncHandler(async (req, res) => {
  const validation = goalSchema.safeParse({
    ...req.body,
    targetAmount: Number(req.body.targetAmount),
    currentAmount: req.body.currentAmount ? Number(req.body.currentAmount) : 0,
  });

  if (!validation.success) {
    const errorMessages = validation.error.errors.map((e) => e.message).join(', ');
    return ApiResponse.error(res, errorMessages, 400);
  }

  const { name, targetAmount, currentAmount, deadline, description } = validation.data;

  if (currentAmount > targetAmount) {
    return ApiResponse.error(res, 'Initial saved amount cannot exceed target amount', 400);
  }

  const status = currentAmount >= targetAmount ? 'completed' : 'active';

  const goal = await SavingsGoal.create({
    userId: req.user._id,
    name,
    targetAmount,
    currentAmount,
    deadline: new Date(deadline),
    description: description || '',
    status,
  });

  return ApiResponse.success(res, goal, 'Savings goal created successfully', 201);
});

/**
 * @desc    Get user savings goals
 * @route   GET /api/savings-goals
 * @access  Private
 */
const getSavingsGoals = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { userId: req.user._id };

  if (status && ['active', 'completed', 'cancelled'].includes(status)) {
    filter.status = status;
  }

  const goals = await SavingsGoal.find(filter).sort({ deadline: 1 });

  const formattedGoals = goals.map((goal) => {
    const progressPercentage = Math.min(
      100,
      Math.round((goal.currentAmount / goal.targetAmount) * 100 * 100) / 100
    );
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

    return {
      ...goal.toObject(),
      progressPercentage,
      remainingAmount,
    };
  });

  return ApiResponse.success(res, formattedGoals, 'Savings goals retrieved successfully');
});

/**
 * @desc    Deposit / Add funds toward a savings goal
 * @route   PATCH /api/savings-goals/:id/deposit
 * @access  Private
 */
const depositToGoal = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const depositAmount = Number(amount);

  if (isNaN(depositAmount) || depositAmount <= 0) {
    return ApiResponse.error(res, 'Deposit amount must be a positive number', 400);
  }

  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) {
    return ApiResponse.error(res, 'Savings goal not found', 404);
  }

  if (goal.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Forbidden: You cannot modify this savings goal', 403);
  }

  if (goal.status === 'cancelled') {
    return ApiResponse.error(res, 'Cannot add funds to a cancelled savings goal', 400);
  }

  const newCurrentAmount = goal.currentAmount + depositAmount;

  if (newCurrentAmount > goal.targetAmount) {
    return ApiResponse.error(
      res,
      `Deposit exceeds target amount. Maximum allowed deposit is ₹${goal.targetAmount - goal.currentAmount}`,
      400
    );
  }

  goal.currentAmount = newCurrentAmount;
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = 'completed';
  }

  await goal.save();

  const progressPercentage = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100 * 100) / 100
  );

  return ApiResponse.success(
    res,
    {
      ...goal.toObject(),
      progressPercentage,
      remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount),
    },
    'Funds added to savings goal successfully'
  );
});

/**
 * @desc    Update savings goal
 * @route   PUT /api/savings-goals/:id
 * @access  Private
 */
const updateSavingsGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) {
    return ApiResponse.error(res, 'Savings goal not found', 404);
  }

  if (goal.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Forbidden: You cannot modify this savings goal', 403);
  }

  const { name, targetAmount, currentAmount, deadline, description, status } = req.body;

  if (name) goal.name = name;
  if (targetAmount) goal.targetAmount = Number(targetAmount);
  if (currentAmount !== undefined) goal.currentAmount = Number(currentAmount);
  if (deadline) goal.deadline = new Date(deadline);
  if (description !== undefined) goal.description = description;
  if (status && ['active', 'completed', 'cancelled'].includes(status)) goal.status = status;

  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = 'completed';
  }

  await goal.save();

  return ApiResponse.success(res, goal, 'Savings goal updated successfully');
});

/**
 * @desc    Delete savings goal
 * @route   DELETE /api/savings-goals/:id
 * @access  Private
 */
const deleteSavingsGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) {
    return ApiResponse.error(res, 'Savings goal not found', 404);
  }

  if (goal.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Forbidden: You cannot delete this savings goal', 403);
  }

  await goal.deleteOne();
  return ApiResponse.success(res, { id: req.params.id }, 'Savings goal deleted successfully');
});

module.exports = {
  createSavingsGoal,
  getSavingsGoals,
  depositToGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
};
