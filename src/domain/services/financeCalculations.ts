import type {
  DashboardMetrics,
  FinanceState,
  Goal,
  MoneyTransaction,
  PurchaseDecision,
} from '../entities/finance';
import {
  currentMonthRange,
  daysUntilDayOfMonth,
  isInsideRange,
  remainingDaysInMonth,
} from './dateService';

export function currency(value: number, symbol = 'Rs') {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  return `${symbol} ${formatted}`;
}

export function currentMonthTransactions(
  transactions: MoneyTransaction[],
  now = new Date(),
) {
  const { start, end } = currentMonthRange(now);
  return transactions.filter((transaction) => isInsideRange(transaction.date, start, end));
}

export function sumTransactions(
  transactions: MoneyTransaction[],
  type: 'expense' | 'income',
) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function categoryTotals(transactions: MoneyTransaction[]) {
  return transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amount;
      return totals;
    }, {});
}

export function monthKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function creditCardCycleSpend(transactions: MoneyTransaction[], now = new Date()) {
  return currentMonthTransactions(transactions, now)
    .filter(
      (transaction) =>
        transaction.type === 'expense' && transaction.paymentMode === 'Credit Card',
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function creditCardPayable(state: FinanceState, now = new Date()) {
  const cycleSpend = creditCardCycleSpend(state.transactions, now);
  const activeMonthKey = monthKey(now);
  const openingOutstanding = state.creditCards.reduce(
    (total, card) => total + card.currentUsage,
    0,
  );
  const paidAmount = state.creditCards.reduce(
    (total, card) =>
      total + (card.paidMonthKey === activeMonthKey ? card.paidAmountThisMonth ?? 0 : 0),
    0,
  );

  return Math.max(openingOutstanding + cycleSpend - paidAmount, 0);
}

export function calculateDashboardMetrics(
  state: FinanceState,
  now = new Date(),
): DashboardMetrics {
  const monthlyTransactions = currentMonthTransactions(state.transactions, now);
  const currentMonthExpenses = sumTransactions(monthlyTransactions, 'expense');
  const currentMonthIncome = sumTransactions(monthlyTransactions, 'income');
  const fixedExpenseTotal = state.profile.fixedExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const paidFixedExpenseTotal = state.profile.fixedExpenses
    .filter((expense) => expense.paidThisMonth)
    .reduce((total, expense) => total + expense.amount, 0);
  const unpaidFixedExpenseTotal = fixedExpenseTotal - paidFixedExpenseTotal;
  const plannedGoalSavings = state.goals.reduce(
    (total, goal) => total + goal.monthlyContribution,
    0,
  );
  const debtOutstandingTotal = state.debts.reduce(
    (total, debt) => total + debt.outstandingAmount,
    0,
  );
  const debtPaymentTotal = state.debts.reduce((total, debt) => total + debt.minimumPayment, 0);
  const paidDebtPaymentTotal = state.debts
    .filter((debt) => debt.paidThisMonth)
    .reduce((total, debt) => total + debt.minimumPayment, 0);
  const unpaidDebtPaymentTotal = debtPaymentTotal - paidDebtPaymentTotal;
  const cardCycleSpend = creditCardCycleSpend(state.transactions, now);
  const cardPayable = creditCardPayable(state, now);
  const expectedIncome =
    state.profile.monthlySalary + state.profile.salaryAdjustmentThisMonth + currentMonthIncome;
  const remainingMonthlyBudget =
    expectedIncome -
    fixedExpenseTotal -
    debtPaymentTotal -
    plannedGoalSavings -
    currentMonthExpenses;
  const availableBalance =
    expectedIncome - paidFixedExpenseTotal - paidDebtPaymentTotal - currentMonthExpenses;
  const savingsPotential = Math.max(remainingMonthlyBudget, 0);
  const creditLimit = state.creditCards.reduce((total, card) => total + card.limit, 0);
  const creditUtilization = creditLimit <= 0 ? 0 : cardPayable / creditLimit;
  const expenseRatio = expectedIncome <= 0 ? 0 : (fixedExpenseTotal + currentMonthExpenses) / expectedIncome;
  const savingsRatio = expectedIncome <= 0 ? 0 : savingsPotential / expectedIncome;
  const topCategory = Object.entries(categoryTotals(monthlyTransactions)).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return {
    baseSalary: state.profile.monthlySalary,
    salaryAdjustment: state.profile.salaryAdjustmentThisMonth,
    expectedMonthlyIncome: expectedIncome,
    availableBalance,
    currentMonthExpenses,
    currentMonthIncome,
    fixedExpenseTotal,
    paidFixedExpenseTotal,
    unpaidFixedExpenseTotal,
    plannedGoalSavings,
    debtOutstandingTotal,
    debtPaymentTotal,
    paidDebtPaymentTotal,
    unpaidDebtPaymentTotal,
    creditCardCycleSpend: cardCycleSpend,
    creditCardPayable: cardPayable,
    remainingMonthlyBudget,
    safeSpendToday: Math.max(remainingMonthlyBudget / remainingDaysInMonth(now), 0),
    savingsPotential,
    daysUntilSalary: daysUntilDayOfMonth(state.profile.salaryDay, now),
    financialHealthScore: calculateHealthScore({
      savingsRatio,
      expenseRatio,
      creditUtilization,
      goals: state.goals,
      budgetRemaining: remainingMonthlyBudget,
    }),
    topSpendingCategory: topCategory?.[0] ?? 'No spending yet',
    savingsRatio,
    expenseRatio,
    creditUtilization,
  };
}

export function calculateHealthScore(input: {
  savingsRatio: number;
  expenseRatio: number;
  creditUtilization: number;
  goals: Goal[];
  budgetRemaining: number;
}) {
  const savingsScore = clamp(input.savingsRatio / 0.25, 0, 1) * 30;
  const expenseScore = clamp((0.85 - input.expenseRatio) / 0.45, 0, 1) * 25;
  const creditScore = clamp((0.6 - input.creditUtilization) / 0.6, 0, 1) * 20;
  const activeGoals = input.goals.filter(
    (goal) => goal.currentSavings > 0 || goal.monthlyContribution > 0,
  );
  const goalAverage =
    activeGoals.length === 0
      ? 0.5
      : activeGoals.reduce(
          (total, goal) => total + clamp(goal.currentSavings / goal.targetAmount, 0, 1),
          0,
        ) / activeGoals.length;
  const goalScore = goalAverage * 15;
  const disciplineScore = input.budgetRemaining >= 0 ? 10 : 0;

  return Math.round(savingsScore + expenseScore + creditScore + goalScore + disciplineScore);
}

export function generateInsights(state: FinanceState, now = new Date()) {
  const metrics = calculateDashboardMetrics(state, now);
  const monthlyTransactions = currentMonthTransactions(state.transactions, now);
  const totals = categoryTotals(monthlyTransactions);
  const topCategory = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  const insights: string[] = [];

  if (metrics.remainingMonthlyBudget > 0) {
    insights.push(`You can still spend ${currency(metrics.safeSpendToday)} safely today.`);
  } else {
    insights.push('Your monthly plan is under pressure. Pause non-essential spends.');
  }

  if (metrics.unpaidFixedExpenseTotal > 0) {
    insights.push(`${currency(metrics.unpaidFixedExpenseTotal)} of fixed bills are still unpaid.`);
  } else {
    insights.push('All fixed bills are marked paid for this month.');
  }

  if (metrics.unpaidDebtPaymentTotal > 0) {
    insights.push(`${currency(metrics.unpaidDebtPaymentTotal)} of debt payments are still due.`);
  }

  if (metrics.creditCardPayable > 0) {
    insights.push(`${currency(metrics.creditCardPayable)} is currently payable on your credit card.`);
  }

  if (topCategory) {
    insights.push(`${topCategory[0]} is the biggest spending category this month.`);
  }

  if (metrics.creditUtilization > 0.5) {
    insights.push('Credit utilization is elevated. Keep the next card payment conservative.');
  } else {
    insights.push('Credit utilization is currently under control.');
  }

  if (metrics.savingsPotential >= 8500) {
    insights.push(`You can save about ${currency(metrics.savingsPotential)} this month.`);
  }

  const urgentGoal = state.goals.find(
    (goal) => goal.monthlyContribution > 0 && monthsUntil(goal.deadline, now) <= 3,
  );
  if (urgentGoal) {
    insights.push(`${urgentGoal.name} needs consistent monthly contributions now.`);
  }

  return insights;
}

export function evaluatePurchase(
  state: FinanceState,
  itemName: string,
  amount: number,
  now = new Date(),
): PurchaseDecision {
  const metrics = calculateDashboardMetrics(state, now);
  const futureMonthlySalary = state.profile.expectedSalaryMin;
  const nextMonthSurplus =
    futureMonthlySalary -
    state.profile.fixedExpenses.reduce((total, expense) => total + expense.amount, 0) -
    state.debts.reduce((total, debt) => total + debt.minimumPayment, 0) -
    state.goals.reduce((total, goal) => total + goal.monthlyContribution, 0);

  if (amount <= metrics.remainingMonthlyBudget * 0.6 && metrics.financialHealthScore >= 70) {
    return {
      verdict: 'YES',
      confidence: 88,
      summary: `${itemName} fits inside this month without hurting your plan.`,
      impact: [
        `Remaining budget after purchase: ${currency(metrics.remainingMonthlyBudget - amount)}`,
        `Health score stays near ${metrics.financialHealthScore}.`,
      ],
    };
  }

  if (amount <= nextMonthSurplus * 0.7 && metrics.financialHealthScore >= 55) {
    return {
      verdict: 'BUY NEXT MONTH',
      confidence: 76,
      summary: `${itemName} is possible after the next salary cycle.`,
      impact: [
        `Projected next-month surplus: ${currency(nextMonthSurplus)}`,
        'Buying now would reduce daily flexibility too much.',
      ],
    };
  }

  if (amount <= metrics.availableBalance && metrics.financialHealthScore >= 45) {
    return {
      verdict: 'WAIT',
      confidence: 69,
      summary: `${itemName} is affordable on paper, but not disciplined this month.`,
      impact: [
        `Safe spend today is ${currency(metrics.safeSpendToday)}.`,
        'Delay until fixed expenses and card dues are settled.',
      ],
    };
  }

  return {
    verdict: 'NO',
    confidence: 84,
    summary: `${itemName} does not fit the current cash-flow plan.`,
    impact: [
      `Available balance is ${currency(metrics.availableBalance)}.`,
      'Protect emergency fund and goal contributions first.',
    ],
  };
}

function monthsUntil(value: string, now: Date) {
  const date = new Date(value);
  return (date.getFullYear() - now.getFullYear()) * 12 + date.getMonth() - now.getMonth();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
