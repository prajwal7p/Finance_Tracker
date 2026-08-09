const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      trim: true,
      maxlength: [30, 'Category name cannot exceed 30 characters'],
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'both'],
      required: [true, 'Please specify category type (income, expense, or both)'],
    },
    icon: {
      type: String,
      default: 'Tag',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system-wide default categories
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate category names per user or default
categorySchema.index({ name: 1, createdBy: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
