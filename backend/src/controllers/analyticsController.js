const Transaction = require('../models/Transaction');
const SavingsGoal = require('../models/SavingsGoal');
const Budget = require('../models/Budget');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncWrapper');
const mongoose = require('mongoose');

/**
 * @desc    Get dashboard metrics & summary data
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
const getDashboardData = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  // 1. Overall Income vs Expense Totals
  const totals = await Transaction.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;

  totals.forEach((item) => {
    if (item._id === 'income') totalIncome = item.total;
    if (item._id === 'expense') totalExpenses = item.total;
  });

  const currentBalance = totalIncome - totalExpenses;

  // 2. Total Active Savings
  const savingsResult = await SavingsGoal.aggregate([
    { $match: { userId, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, totalSaved: { $sum: '$currentAmount' } } },
  ]);

  const totalSavings = savingsResult[0]?.totalSaved || 0;

  // 3. Recent 5 Transactions
  const recentTransactions = await Transaction.find({ userId })
    .populate('categoryId', 'name type icon color')
    .sort({ date: -1 })
    .limit(5);

  // 4. Current Month Category Expense Breakdown
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const categoryExpenses = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: '$categoryId',
        totalSpent: { $sum: '$amount' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    { $sort: { totalSpent: -1 } },
  ]);

  const formattedCategoryExpenses = categoryExpenses.map((item) => ({
    categoryId: item.category._id,
    name: item.category.name,
    color: item.category.color || '#6366f1',
    totalSpent: item.totalSpent,
  }));

  // 5. Income vs Expense Last 6 Months Trend
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyTrendsRaw = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Construct 6-month continuous timeline array
  const monthsList = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mNum = d.getMonth() + 1;
    const yNum = d.getFullYear();
    const monthLabel = d.toLocaleString('default', { month: 'short' });

    let income = 0;
    let expense = 0;

    monthlyTrendsRaw.forEach((row) => {
      if (row._id.year === yNum && row._id.month === mNum) {
        if (row._id.type === 'income') income = row.total;
        if (row._id.type === 'expense') expense = row.total;
      }
    });

    monthsList.push({
      month: `${monthLabel} ${yNum.toString().substring(2)}`,
      income,
      expense,
      savings: Math.max(0, income - expense),
    });
  }

  return ApiResponse.success(
    res,
    {
      summary: {
        totalIncome,
        totalExpenses,
        currentBalance,
        totalSavings,
      },
      recentTransactions,
      topCategoryExpenses: formattedCategoryExpenses.slice(0, 5),
      categoryExpenses: formattedCategoryExpenses,
      monthlyTrends: monthsList,
    },
    'Dashboard data retrieved successfully'
  );
});

module.exports = {
  getDashboardData,
};
