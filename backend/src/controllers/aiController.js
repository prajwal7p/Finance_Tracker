const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncWrapper');
const { generateFinancialPromptData, getAIInsights } = require('../services/aiService');

const analyzeSpending = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const userId = req.user._id;

  const totals = await Transaction.aggregate([
    { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);
  const currentMonthSummary = {
    totalIncome: totals.find((item) => item._id === 'income')?.total || 0,
    totalExpenses: totals.find((item) => item._id === 'expense')?.total || 0,
  };

  const categorySpending = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } },
    { $group: { _id: '$categoryId', totalSpent: { $sum: '$amount' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $project: { name: { $ifNull: ['$category.name', 'Uncategorized'] }, totalSpent: 1 } },
    { $sort: { totalSpent: -1 } },
  ]);

  const budgets = await Budget.find({
    userId,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }).populate('categoryId', 'name');
  const spentByCategory = new Map(categorySpending.map((item) => [item._id?.toString(), item.totalSpent]));
  const budgetOverruns = budgets
    .map((budget) => {
      const spent = spentByCategory.get(budget.categoryId?._id?.toString()) || 0;
      return {
        category: budget.categoryId,
        amount: budget.amount,
        spent,
        excessAmount: Math.max(0, spent - budget.amount),
      };
    })
    .filter((budget) => budget.excessAmount > 0);

  const financialData = generateFinancialPromptData({
    userCurrency: req.user.currency,
    currentMonthSummary,
    categorySpending,
    budgetOverruns,
  });
  const insights = await getAIInsights(financialData);

  return ApiResponse.success(res, { insights, period: { startOfMonth, endOfMonth } }, 'Spending analysis generated successfully');
});

module.exports = { analyzeSpending };
