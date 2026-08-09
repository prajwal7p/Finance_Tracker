const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncWrapper');
const { z } = require('zod');

// Input Validation Schema using Zod
const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(200),
  paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'other']).optional(),
  date: z.string().or(z.date()).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * @desc    Create a new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = asyncHandler(async (req, res) => {
  const validation = transactionSchema.safeParse({
    ...req.body,
    amount: Number(req.body.amount),
  });

  if (!validation.success) {
    const errorMessages = validation.error.errors.map((e) => e.message).join(', ');
    return ApiResponse.error(res, errorMessages, 400);
  }

  const { type, amount, categoryId, description, paymentMethod, date, notes } = validation.data;

  // Verify category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    return ApiResponse.error(res, 'Selected category does not exist', 400);
  }

  // Derive userId ONLY from authenticated request - never trust body parameters
  const transaction = await Transaction.create({
    userId: req.user._id,
    type,
    amount,
    categoryId,
    description,
    paymentMethod: paymentMethod || 'upi',
    date: date ? new Date(date) : new Date(),
    notes: notes || '',
  });

  const populatedTransaction = await Transaction.findById(transaction._id).populate('categoryId', 'name type icon color');

  return ApiResponse.success(res, populatedTransaction, 'Transaction created successfully', 201);
});

/**
 * @desc    Get all transactions for logged in user (with search, filter, pagination)
 * @route   GET /api/transactions
 * @access  Private
 */
const getTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const { search, categoryId, type, startDate, endDate, sortBy, sortOrder } = req.query;

  // Strict user isolation filter
  const filter = { userId: req.user._id };

  if (type && ['income', 'expense'].includes(type)) {
    filter.type = type;
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  if (search) {
    filter.description = { $regex: search, $options: 'i' };
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const sortField = sortBy || 'date';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('categoryId', 'name type icon color')
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return ApiResponse.success(
    res,
    transactions,
    'Transactions retrieved successfully',
    200,
    {
      page,
      limit,
      total,
      totalPages,
    }
  );
});

/**
 * @desc    Get single transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id).populate('categoryId', 'name type icon color');

  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', 404);
  }

  // Strict authorization check: User A cannot read User B's transaction
  if (transaction.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Forbidden: You do not have permission to view this transaction', 403);
  }

  return ApiResponse.success(res, transaction, 'Transaction details retrieved');
});

/**
 * @desc    Update a transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
const updateTransaction = asyncHandler(async (req, res) => {
  let transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', 404);
  }

  // Strict authorization check
  if (transaction.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Forbidden: You do not have permission to modify this transaction', 403);
  }

  const { type, amount, categoryId, description, paymentMethod, date, notes } = req.body;

  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      return ApiResponse.error(res, 'Selected category does not exist', 400);
    }
  }

  const updateFields = {};
  if (type) updateFields.type = type;
  if (amount) updateFields.amount = Number(amount);
  if (categoryId) updateFields.categoryId = categoryId;
  if (description) updateFields.description = description;
  if (paymentMethod) updateFields.paymentMethod = paymentMethod;
  if (date) updateFields.date = new Date(date);
  if (notes !== undefined) updateFields.notes = notes;

  const updatedTransaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  ).populate('categoryId', 'name type icon color');

  return ApiResponse.success(res, updatedTransaction, 'Transaction updated successfully');
});

/**
 * @desc    Delete a transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', 404);
  }

  // Strict authorization check
  if (transaction.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Forbidden: You do not have permission to delete this transaction', 403);
  }

  await transaction.deleteOne();

  return ApiResponse.success(res, { id: req.params.id }, 'Transaction deleted successfully');
});

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
