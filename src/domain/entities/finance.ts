export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'Food'
  | 'Groceries'
  | 'Parents'
  | 'Rent'
  | 'Travel'
  | 'Utilities'
  | 'Pet'
  | 'Shopping'
  | 'Health'
  | 'Entertainment'
  | 'Education'
  | 'Investment'
  | 'EMI'
  | 'Credit Card'
  | 'Other';

export type PaymentMode = 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Bank Transfer';

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  dueDay: number;
  paidThisMonth: boolean;
}

export interface FinancialProfile {
  name: string;
  monthlySalary: number;
  salaryAdjustmentThisMonth: number;
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  salaryDay: number;
  currencyCode: 'INR';
  currencySymbol: string;
  creditCardLimit: number;
  monthlySavingsTarget: number;
  fixedExpenses: FixedExpense[];
}

export interface MoneyTransaction {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory | 'Salary' | 'Bonus' | 'Freelance';
  date: string;
  paymentMode: PaymentMode;
  type: TransactionType;
  notes: string;
  tags: string[];
  recurring: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  deadline: string;
  currentSavings: number;
  monthlyContribution: number;
  note: string;
}

export interface CreditCardAccount {
  id: string;
  cardName: string;
  limit: number;
  currentUsage: number;
  statementDay: number;
  dueDay: number;
  minimumDue: number;
  outstanding: number;
}

export interface FinanceState {
  schemaVersion: number;
  profile: FinancialProfile;
  transactions: MoneyTransaction[];
  goals: Goal[];
  creditCards: CreditCardAccount[];
}

export interface DashboardMetrics {
  baseSalary: number;
  salaryAdjustment: number;
  expectedMonthlyIncome: number;
  availableBalance: number;
  currentMonthExpenses: number;
  currentMonthIncome: number;
  fixedExpenseTotal: number;
  paidFixedExpenseTotal: number;
  unpaidFixedExpenseTotal: number;
  plannedGoalSavings: number;
  remainingMonthlyBudget: number;
  safeSpendToday: number;
  savingsPotential: number;
  daysUntilSalary: number;
  financialHealthScore: number;
  topSpendingCategory: string;
  savingsRatio: number;
  expenseRatio: number;
  creditUtilization: number;
}

export interface PurchaseDecision {
  verdict: 'YES' | 'NO' | 'WAIT' | 'BUY NEXT MONTH';
  confidence: number;
  summary: string;
  impact: string[];
}
