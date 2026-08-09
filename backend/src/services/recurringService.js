const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');

/**
 * Calculates the next date based on frequency
 */
const calculateNextDate = (currentNextDate, frequency) => {
  const next = new Date(currentNextDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
};

/**
 * Process due recurring transactions and generate actual transaction records automatically
 */
const processDueRecurringTransactions = async () => {
  try {
    const now = new Date();
    const dueItems = await RecurringTransaction.find({
      isActive: true,
      nextDate: { $lte: now },
    });

    let processedCount = 0;

    for (const item of dueItems) {
      // Check if end date reached
      if (item.endDate && new Date(item.endDate) < now) {
        item.isActive = false;
        await item.save();
        continue;
      }

      // Create transaction safely
      await Transaction.create({
        userId: item.userId,
        type: item.type,
        amount: item.amount,
        categoryId: item.categoryId,
        description: `[Recurring] ${item.description}`,
        paymentMethod: 'bank_transfer',
        date: item.nextDate,
        notes: `Automatically generated from recurring ${item.frequency} schedule`,
      });

      // Compute and save next execution date
      const nextDate = calculateNextDate(item.nextDate, item.frequency);
      item.nextDate = nextDate;

      // Deactivate if next date exceeds end date
      if (item.endDate && nextDate > new Date(item.endDate)) {
        item.isActive = false;
      }

      await item.save();
      processedCount++;
    }

    if (processedCount > 0) {
      console.log(`[Recurring Engine] Processed ${processedCount} due recurring transactions`);
    }

    return processedCount;
  } catch (error) {
    console.error('[Recurring Engine Error]', error.message);
    return 0;
  }
};

module.exports = {
  calculateNextDate,
  processDueRecurringTransactions,
};
