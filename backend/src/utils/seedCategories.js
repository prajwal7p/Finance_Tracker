const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#ef4444', isDefault: true },
  { name: 'Shopping & Groceries', type: 'expense', icon: 'ShoppingBag', color: '#f59e0b', isDefault: true },
  { name: 'Transportation & Fuel', type: 'expense', icon: 'Car', color: '#3b82f6', isDefault: true },
  { name: 'Bills & Utilities', type: 'expense', icon: 'Receipt', color: '#8b5cf6', isDefault: true },
  { name: 'Entertainment & Leisure', type: 'expense', icon: 'Film', color: '#ec4899', isDefault: true },
  { name: 'Healthcare & Fitness', type: 'expense', icon: 'Activity', color: '#10b981', isDefault: true },
  { name: 'Education & Learning', type: 'expense', icon: 'BookOpen', color: '#6366f1', isDefault: true },
  { name: 'Housing & Rent', type: 'expense', icon: 'Home', color: '#06b6d4', isDefault: true },
  { name: 'Salary & Wage', type: 'income', icon: 'Wallet', color: '#22c55e', isDefault: true },
  { name: 'Freelance & Business', type: 'income', icon: 'Briefcase', color: '#14b8a6', isDefault: true },
  { name: 'Investments & Dividends', type: 'income', icon: 'TrendingUp', color: '#84cc16', isDefault: true },
  { name: 'Gifts & Grants', type: 'income', icon: 'Gift', color: '#eab308', isDefault: true },
  { name: 'Other / Miscellaneous', type: 'both', icon: 'MoreHorizontal', color: '#64748b', isDefault: true },
];

const seedDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments({ isDefault: true });
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log('[Seed] Default categories initialized successfully');
    }
  } catch (error) {
    console.error('[Seed Error] Failed to seed default categories:', error.message);
  }
};

module.exports = seedDefaultCategories;
