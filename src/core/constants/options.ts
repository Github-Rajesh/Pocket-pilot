import type { ExpenseCategory, PaymentMode } from '../../domain/entities/finance';

export const expenseCategories: ExpenseCategory[] = [
  'Food',
  'Groceries',
  'Parents',
  'Rent',
  'Travel',
  'Utilities',
  'Pet',
  'Shopping',
  'Health',
  'Entertainment',
  'Education',
  'Investment',
  'EMI',
  'Credit Card',
  'Other',
];

export const incomeCategories = ['Salary', 'Bonus', 'Freelance'] as const;

export const paymentModes: PaymentMode[] = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Bank Transfer',
];
