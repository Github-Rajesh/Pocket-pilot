import {
  ArrowRight,
  Bot,
  CalendarClock,
  IndianRupee,
  PiggyBank,
  Plus,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../../app/FinanceProvider';
import { ProgressBar } from '../../core/components/ProgressBar';
import { StatCard } from '../../core/components/StatCard';
import {
  calculateDashboardMetrics,
  currency,
  generateInsights,
} from '../../domain/services/financeCalculations';

interface DashboardProps {
  onNavigate: (section: 'transactions' | 'goals' | 'analytics' | 'assistant') => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state, toggleFixedExpensePaid } = useFinance();
  const metrics = calculateDashboardMetrics(state);
  const insights = generateInsights(state).slice(0, 4);

  return (
    <section className="screen dashboard-screen">
      <header className="screen-header dashboard-hero">
        <div>
          <span className="eyebrow">Today&apos;s command center</span>
          <h1>{currency(metrics.safeSpendToday)} safe to spend today</h1>
          <p>
            Salary, unpaid fixed bills, optional goal contributions, card usage, and this
            month&apos;s spending are factored in.
          </p>
        </div>
        <div className="health-ring" aria-label={`Financial health score ${metrics.financialHealthScore}`}>
          <span>{metrics.financialHealthScore}</span>
          <small>Health</small>
        </div>
      </header>

      <div className="quick-actions">
        <button className="action-button" onClick={() => onNavigate('transactions')} type="button">
          <Plus size={18} />
          Add expense
        </button>
        <button className="action-button" onClick={() => onNavigate('transactions')} type="button">
          <IndianRupee size={18} />
          Add income
        </button>
        <button className="action-button" onClick={() => onNavigate('assistant')} type="button">
          <Bot size={18} />
          Ask AI
        </button>
        <button className="action-button" onClick={() => onNavigate('analytics')} type="button">
          <TrendingUp size={18} />
          Analytics
        </button>
      </div>

      <div className="stat-grid">
        <StatCard
          icon={<IndianRupee size={18} />}
          label="Expected income"
          value={currency(metrics.expectedMonthlyIncome)}
        />
        <StatCard
          icon={<ShieldCheck size={18} />}
          label="Cash before unpaid bills"
          tone="good"
          value={currency(metrics.availableBalance)}
        />
        <StatCard
          icon={<PiggyBank size={18} />}
          label="Unpaid fixed bills"
          tone="good"
          value={currency(metrics.unpaidFixedExpenseTotal)}
        />
        <StatCard
          icon={<CalendarClock size={18} />}
          label="Days until salary"
          value={`${metrics.daysUntilSalary} days`}
        />
      </div>

      <div className="content-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Budget</span>
              <h2>Monthly Progress</h2>
            </div>
            <strong>{currency(metrics.remainingMonthlyBudget)}</strong>
          </div>
          <ProgressBar label="Expense ratio" value={metrics.expenseRatio} />
          <ProgressBar label="Savings ratio" value={metrics.savingsRatio} />
          <ProgressBar label="Credit utilization" value={metrics.creditUtilization} />
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Signals</span>
              <h2>Smart Insights</h2>
            </div>
          </div>
          <div className="insight-list">
            {insights.map((insight) => (
              <div className="insight-item" key={insight}>
                <ArrowRight size={16} />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="content-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Upcoming</span>
              <h2>Bills</h2>
            </div>
          </div>
          <div className="bill-list">
            {state.profile.fixedExpenses.map((expense) => (
              <div className="bill-row" key={expense.id}>
                <div>
                  <strong>{expense.name}</strong>
                  <span>
                    Due day {expense.dueDay} - {expense.paidThisMonth ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <div className="bill-row__actions">
                  <span>{currency(expense.amount)}</span>
                  <button
                    className={expense.paidThisMonth ? 'status-pill status-pill--paid' : 'status-pill'}
                    onClick={() => toggleFixedExpensePaid(expense.id)}
                    type="button"
                  >
                    {expense.paidThisMonth ? 'Paid' : 'Mark paid'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Priority</span>
              <h2>Goal Progress</h2>
            </div>
          </div>
          <div className="goal-mini-list">
            {state.goals.slice(0, 3).map((goal) => (
              <div key={goal.id}>
                <ProgressBar
                  label={goal.name}
                  value={goal.targetAmount > 0 ? goal.currentSavings / goal.targetAmount : 0}
                />
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
