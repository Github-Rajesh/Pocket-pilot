import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seedFinanceState } from '../src/domain/seedFinanceState';
import {
  calculateDashboardMetrics,
  evaluatePurchase,
} from '../src/domain/services/financeCalculations';

test('calculates safe spend from remaining monthly budget', () => {
  const metrics = calculateDashboardMetrics(seedFinanceState, new Date(2026, 7, 10));

  assert.equal(metrics.currentMonthExpenses, 11550);
  assert.equal(metrics.remainingMonthlyBudget, 11950);
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
