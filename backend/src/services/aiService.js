const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Summarize user financial metrics safely for AI analysis
 */
const generateFinancialPromptData = ({
  userCurrency,
  currentMonthSummary,
  categorySpending,
  budgetOverruns,
}) => {
  return {
    currency: userCurrency || 'INR',
    income: currentMonthSummary.totalIncome,
    expenses: currentMonthSummary.totalExpenses,
    netSavings: currentMonthSummary.totalIncome - currentMonthSummary.totalExpenses,
    topCategories: categorySpending.slice(0, 5).map((c) => ({
      category: c.name,
      amount: c.totalSpent,
    })),
    budgetOverruns: budgetOverruns.map((b) => ({
      category: b.category?.name || 'Category',
      budgeted: b.amount,
      spent: b.spent,
      exceededBy: b.excessAmount,
    })),
  };
};

/**
 * Call Gemini API or return intelligent structured financial analysis
 */
const getAIInsights = async (financialData) => {
  const apiKey = process.env.AI_API_KEY;

  const promptText = `
You are FinTrack AI, an intelligent personal finance analysis engine.
Analyze the following user monthly financial data and provide structured insights:

Data:
Currency: ${financialData.currency}
Total Monthly Income: ${financialData.income}
Total Monthly Expenses: ${financialData.expenses}
Net Monthly Savings: ${financialData.netSavings}
Top Category Expenses: ${JSON.stringify(financialData.topCategories)}
Budget Overruns: ${JSON.stringify(financialData.budgetOverruns)}

Instructions:
Respond strictly in JSON format matching this structure:
{
  "summary": "Short 2-sentence summary of overall financial health for the month.",
  "topSpendingTrend": "Analysis of the highest spending category and trend.",
  "budgetAlerts": ["Alert 1 if budget exceeded", "Alert 2 if close to budget limit"],
  "actionableTips": [
    "Tip 1: Practical step to reduce highest expense",
    "Tip 2: Recommendation for savings optimization",
    "Tip 3: Budget adjustment recommendation"
  ]
}
`;

  if (apiKey && apiKey !== 'mock_key_for_development' && apiKey !== 'your_gemini_api_key_here') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent(promptText);
      const responseText = result.response.text();

      // Clean JSON output if wrapped in markdown code blocks
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed;
    } catch (err) {
      console.error('[Gemini API Error]', err.message);
    }
  }

  // Robust Heuristic Fallback Analysis if API Key is not configured or fails
  const alerts = [];
  if (financialData.budgetOverruns.length > 0) {
    financialData.budgetOverruns.forEach((b) => {
      alerts.push(
        `Budget Warning: Your '${b.category}' spending reached ${financialData.currency} ${b.spent}, exceeding target budget of ${financialData.currency} ${b.budgeted} by ${financialData.currency} ${b.exceededBy}.`
      );
    });
  } else if (financialData.expenses > financialData.income) {
    alerts.push(`Critical Warning: Your total expenses (${financialData.currency} ${financialData.expenses}) exceed your total income (${financialData.currency} ${financialData.income}).`);
  } else {
    alerts.push(`Great job! You stayed within your overall monthly budget parameters.`);
  }

  const topCategory = financialData.topCategories[0] || { category: 'General', amount: 0 };
  const savingsRate = financialData.income > 0 ? Math.round((financialData.netSavings / financialData.income) * 100) : 0;

  return {
    summary: `For this month, you earned ${financialData.currency} ${financialData.income.toLocaleString()} and spent ${financialData.currency} ${financialData.expenses.toLocaleString()}, leaving a net savings balance of ${financialData.currency} ${financialData.netSavings.toLocaleString()} (${savingsRate}% savings rate).`,
    topSpendingTrend: `Your highest expenditure category was '${topCategory.category}' at ${financialData.currency} ${topCategory.amount.toLocaleString()}.`,
    budgetAlerts: alerts,
    actionableTips: [
      `Review expenses under '${topCategory.category}' to find recurring non-essential subscriptions or discretionary orders.`,
      `Aim to maintain a monthly savings rate of at least 20% by setting aside savings immediately upon income receipt.`,
      financialData.budgetOverruns.length > 0
        ? `Adjust your next month's budget allocations for categories with recurring overruns.`
        : `Consider assigning excess net savings toward your active high-priority Savings Goals.`,
    ],
  };
};

module.exports = {
  generateFinancialPromptData,
  getAIInsights,
};
