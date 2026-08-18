import { useMemo } from 'react';
import { useFinance } from '../../app/FinanceProvider';
import { StatCard } from '../../core/components/StatCard';
import {
  calculateDashboardMetrics,
  categoryTotals,
  currentMonthTransactions,
  currency,
} from '../../domain/services/financeCalculations';

interface AnalyticsProps {
  onNavigate: (section: 'transactions' | 'debts') => void;
}

export function Analytics({ onNavigate }: AnalyticsProps) {
  const { state } = useFinance();
  const metrics = calculateDashboardMetrics(state);
  const monthlyTransactions = currentMonthTransactions(state.transactions);
  const totals = useMemo(() => {
    const entries = Object.entries(categoryTotals(monthlyTransactions)).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(([, amount]) => amount), 1);
    return entries.map(([category, amount]) => ({ category, amount, width: (amount / max) * 100 }));
  }, [monthlyTransactions]);
  const cashFlowRows = [
    { label: 'Base salary', amount: metrics.baseSalary, tone: 'positive' },
    { label: 'Salary adjustment', amount: metrics.salaryAdjustment, tone: metrics.salaryAdjustment >= 0 ? 'positive' : 'negative' },
    { label: 'Extra income', amount: metrics.currentMonthIncome, tone: 'positive' },
    { label: 'Fixed bills paid', amount: -metrics.paidFixedExpenseTotal, tone: 'negative' },
    { label: 'Fixed bills still unpaid', amount: -metrics.unpaidFixedExpenseTotal, tone: 'reserved' },
    { label: 'Debt payments paid', amount: -metrics.paidDebtPaymentTotal, tone: 'negative' },
    { label: 'Debt payments still due', amount: -metrics.unpaidDebtPaymentTotal, tone: 'reserved' },
    { label: 'Flexible spending', amount: -metrics.currentMonthExpenses, tone: 'negative' },
    { label: 'Goal contributions planned', amount: -metrics.plannedGoalSavings, tone: 'reserved' },
  ];

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <span className="eyebrow">This month</span>
          <h1>Money Map</h1>
          <p>Income, fixed commitments, unpaid bills, flexible spending, and safe balance.</p>
        </div>
      </header>

      <div className="stat-grid">
        <StatCard label="Expected income" tone="good" value={currency(metrics.expectedMonthlyIncome)} />
        <StatCard
          label="Already spent"
          value={currency(
            metrics.currentMonthExpenses + metrics.paidFixedExpenseTotal + metrics.paidDebtPaymentTotal,
          )}
        />
        <StatCard
          label="Still reserved"
          value={currency(
            metrics.unpaidFixedExpenseTotal +
              metrics.unpaidDebtPaymentTotal +
              metrics.plannedGoalSavings,
          )}
        />
        <StatCard label="Safe balance" tone="good" value={currency(metrics.remainingMonthlyBudget)} />
      </div>

      <div className="content-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Flow</span>
              <h2>Monthly Breakdown</h2>
            </div>
          </div>
          <div className="cash-flow-list">
            {cashFlowRows.map((row) => (
              <div className="cash-flow-row" key={row.label}>
                <div>
                  <span>{row.label}</span>
                  <strong className={`cash-flow-row__amount cash-flow-row__amount--${row.tone}`}>
                    {row.amount < 0 ? '-' : '+'}
                    {currency(Math.abs(row.amount))}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Categories</span>
              <h2>Flexible Spending</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate('transactions')} type="button">
              Add expense
            </button>
          </div>
          <div className="bar-list">
            {totals.length === 0 && (
              <p className="muted-copy">
                Flexible spending is built from expenses you add in Money. Fixed bills and debts are tracked separately.
              </p>
            )}
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
      </div>

      <article className="panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Ratios</span>
            <h2>Health Inputs</h2>
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
          <div>
            <span>Debt outstanding</span>
            <strong>{currency(metrics.debtOutstandingTotal)}</strong>
          </div>
        </div>
      </article>

      <article className="panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Debt</span>
            <h2>Money You Owe</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate('debts')} type="button">
            Manage debts
          </button>
        </div>
        <div className="cash-flow-list">
          {state.debts.length === 0 && <p className="muted-copy">No debts added.</p>}
          {state.debts.map((debt) => (
            <div className="cash-flow-row" key={debt.id}>
              <div>
                <span>{debt.lender}</span>
                <strong className="cash-flow-row__amount cash-flow-row__amount--reserved">
                  {currency(debt.outstandingAmount)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
