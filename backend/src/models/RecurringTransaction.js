const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recurring transaction must belong to a user'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Type is required (income or expense)'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: [true, 'Frequency is required (daily, weekly, monthly, or yearly)'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    nextDate: {
      type: Date,
      required: [true, 'Next scheduled date is required'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for high-performance background execution lookup
recurringTransactionSchema.index({ userId: 1, nextDate: 1, isActive: 1 });

const RecurringTransaction = mongoose.model('RecurringTransaction', recurringTransactionSchema);

module.exports = RecurringTransaction;
