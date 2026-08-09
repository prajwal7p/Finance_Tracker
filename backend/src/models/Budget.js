const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Budget must belong to a user'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required for budget'],
    },
    amount: {
      type: Number,
      required: [true, 'Budget target amount is required'],
      min: [1, 'Budget amount must be greater than 0'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required (1-12)'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2000,
      max: 2100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Prevents duplicate budgets for same category/month/year per user
budgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
