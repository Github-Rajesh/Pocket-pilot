import { useMemo } from 'react';
import { useFinance } from '../../app/FinanceProvider';
import { StatCard } from '../../core/components/StatCard';
import {
  calculateDashboardMetrics,
  categoryTotals,
  currentMonthTransactions,
  currency,
} from '../../domain/services/financeCalculations';

export function Analytics() {
  const { state } = useFinance();
  const metrics = calculateDashboardMetrics(state);
  const monthlyTransactions = currentMonthTransactions(state.transactions);
  const totals = useMemo(() => {
    const entries = Object.entries(categoryTotals(monthlyTransactions)).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(([, amount]) => amount), 1);
    return entries.map(([category, amount]) => ({ category, amount, width: (amount / max) * 100 }));
  }, [monthlyTransactions]);

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <span className="eyebrow">Patterns</span>
          <h1>Analytics</h1>
          <p>Cash flow, spending concentration, savings ratio, and category pressure.</p>
        </div>
      </header>

      <div className="stat-grid">
        <StatCard label="Income this month" tone="good" value={currency(metrics.currentMonthIncome)} />
        <StatCard label="Expenses this month" value={currency(metrics.currentMonthExpenses)} />
        <StatCard label="Top category" value={metrics.topSpendingCategory} />
        <StatCard label="Remaining budget" tone="good" value={currency(metrics.remainingMonthlyBudget)} />
      </div>

      <div className="content-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Category wise</span>
              <h2>Spending Distribution</h2>
            </div>
          </div>
          <div className="bar-list">
            {totals.map((item) => (
              <div className="bar-row" key={item.category}>
                <div className="bar-row__label">
                  <span>{item.category}</span>
                  <strong>{currency(item.amount)}</strong>
                </div>
                <div className="bar-track">
                  <span style={{ width: `${item.width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Cash flow</span>
              <h2>Financial Health Mix</h2>
            </div>
          </div>
          <div className="health-breakdown">
            <div>
              <span>Expense ratio</span>
              <strong>{Math.round(metrics.expenseRatio * 100)}%</strong>
            </div>
            <div>
              <span>Savings ratio</span>
              <strong>{Math.round(metrics.savingsRatio * 100)}%</strong>
            </div>
            <div>
              <span>Credit utilization</span>
              <strong>{Math.round(metrics.creditUtilization * 100)}%</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
