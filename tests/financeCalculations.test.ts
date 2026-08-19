import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seedFinanceState } from '../src/domain/seedFinanceState';
import {
  calculateDashboardMetrics,
  evaluatePurchase,
  isCreditCardExpense,
} from '../src/domain/services/financeCalculations';
import type { MoneyTransaction } from '../src/domain/entities/finance';

test('calculates safe spend from remaining monthly budget', () => {
  const metrics = calculateDashboardMetrics(seedFinanceState, new Date(2026, 7, 10));

  assert.equal(metrics.currentMonthExpenses, 11550);
  assert.equal(metrics.fixedExpenseTotal, 46500);
  assert.equal(metrics.unpaidFixedExpenseTotal, 46500);
  assert.equal(metrics.plannedGoalSavings, 0);
  assert.equal(metrics.remainingMonthlyBudget, 27950);
  assert.ok(metrics.safeSpendToday > 500);
  assert.ok(metrics.financialHealthScore >= 0);
  assert.ok(metrics.financialHealthScore <= 100);
});

test('purchase simulator recommends waiting for expensive purchases', () => {
  const decision = evaluatePurchase(
    seedFinanceState,
    'Gaming Laptop',
    95000,
    new Date(2026, 7, 10),
  );

  assert.match(['NO', 'WAIT', 'BUY NEXT MONTH'].join(','), new RegExp(decision.verdict));
});

test('recognizes credit card expense payment mode variants', () => {
  const transaction = {
    id: 'test-card-expense',
    title: 'Card spend',
    amount: 500,
    category: 'Food',
    date: new Date(2026, 7, 10).toISOString(),
    paymentMode: 'credit-card',
    type: 'expense',
    notes: '',
    tags: [],
    recurring: false,
  } as unknown as MoneyTransaction;

  assert.equal(isCreditCardExpense(transaction), true);
  assert.equal(isCreditCardExpense({ ...transaction, paymentMode: 'Debit Card' }), false);
});
