const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncWrapper');

const getAdminOverview = asyncHandler(async (req, res) => {
  const [totalUsers, activeUsers, totalTransactions, transactionTotals, recentUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Transaction.countDocuments(),
    Transaction.aggregate([{ $group: { _id: '$type', total: { $sum: '$amount' } } }]),
    User.find().select('name email role isActive createdAt').sort({ createdAt: -1 }).limit(8),
  ]);

  return ApiResponse.success(res, {
    totalUsers,
    activeUsers,
    disabledUsers: totalUsers - activeUsers,
    totalTransactions,
    totalIncome: transactionTotals.find((item) => item._id === 'income')?.total || 0,
    totalExpenses: transactionTotals.find((item) => item._id === 'expense')?.total || 0,
    recentUsers,
  }, 'Admin overview retrieved successfully');
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return ApiResponse.error(res, 'You cannot disable your own account', 400);
  }
  const user = await User.findById(req.params.id);
  if (!user) return ApiResponse.error(res, 'User not found', 404);
  user.isActive = !user.isActive;
  await user.save();
  return ApiResponse.success(res, { _id: user._id, isActive: user.isActive }, `User ${user.isActive ? 'enabled' : 'disabled'} successfully`);
});

module.exports = { getAdminOverview, toggleUserStatus };
