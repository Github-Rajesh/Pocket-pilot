import { FormEvent, useState } from 'react';
import { Target } from 'lucide-react';
import { useFinance } from '../../app/FinanceProvider';
import { ProgressBar } from '../../core/components/ProgressBar';
import { currency } from '../../domain/services/financeCalculations';

export function Goals() {
  const { state, addGoal } = useFinance();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [deadline, setDeadline] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    const target = Number(targetAmount);
    const saved = Number(currentSavings);
    const contribution = Number(monthlyContribution);

    if (!name.trim() || target <= 0 || !deadline) {
      return;
    }

    addGoal({
      name: name.trim(),
      targetAmount: target,
      currentSavings: Number.isFinite(saved) ? saved : 0,
      monthlyContribution: Number.isFinite(contribution) ? contribution : 0,
      deadline: new Date(deadline).toISOString(),
      note: '',
    });

    setName('');
    setTargetAmount('');
    setCurrentSavings('');
    setMonthlyContribution('');
    setDeadline('');
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <span className="eyebrow">Future money</span>
          <h1>Goals</h1>
          <p>Plan large purchases and savings targets before they pressure your month.</p>
        </div>
      </header>

      <div className="content-grid">
        <form className="panel form-panel" onSubmit={submit}>
          <label>
            Goal name
            <input
              onChange={(event) => setName(event.target.value)}
              placeholder="Laptop, trip, emergency fund"
              value={name}
            />
          </label>
          <label>
            Target amount
            <input
              min="1"
              onChange={(event) => setTargetAmount(event.target.value)}
              type="number"
              value={targetAmount}
            />
          </label>
          <div className="form-row">
            <label>
              Current savings
              <input
                min="0"
                onChange={(event) => setCurrentSavings(event.target.value)}
                type="number"
                value={currentSavings}
              />
            </label>
            <label>
              Monthly contribution
              <input
                min="0"
                onChange={(event) => setMonthlyContribution(event.target.value)}
                type="number"
                value={monthlyContribution}
              />
            </label>
          </div>
          <label>
            Deadline
            <input
              onChange={(event) => setDeadline(event.target.value)}
              type="date"
              value={deadline}
            />
          </label>
          <button className="primary-button" type="submit">
            Add goal
          </button>
        </form>

        <div className="goal-grid">
          {state.goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? goal.currentSavings / goal.targetAmount : 0;
            const remaining = Math.max(goal.targetAmount - goal.currentSavings, 0);

            return (
              <article className="panel goal-card" key={goal.id}>
                <div className="goal-card__icon">
                  <Target size={20} />
                </div>
                <h2>{goal.name}</h2>
                <p>{goal.note || 'A planned financial milestone.'}</p>
                <ProgressBar label="Completion" value={progress} />
                <div className="goal-card__meta">
                  <span>{currency(remaining)} left</span>
                  <span>{currency(goal.monthlyContribution)}/mo</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
