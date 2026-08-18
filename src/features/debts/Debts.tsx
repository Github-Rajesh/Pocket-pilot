import { FormEvent, useState } from 'react';
import { CircleDollarSign, Trash2 } from 'lucide-react';
import { useFinance } from '../../app/FinanceProvider';
import { currency } from '../../domain/services/financeCalculations';

const today = () => new Date().toISOString().slice(0, 10);

export function Debts() {
  const { state, addDebt, deleteDebt, toggleDebtPaid } = useFinance();
  const [lender, setLender] = useState('');
  const [description, setDescription] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [outstandingAmount, setOutstandingAmount] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState(today());

  function submit(event: FormEvent) {
    event.preventDefault();
    const original = Number(originalAmount);
    const outstanding = Number(outstandingAmount);
    const minimum = Number(minimumPayment);

    if (!lender.trim() || outstanding <= 0) {
      return;
    }

    addDebt({
      lender: lender.trim(),
      description: description.trim(),
      originalAmount: Number.isFinite(original) && original > 0 ? original : outstanding,
      outstandingAmount: outstanding,
      minimumPayment: Number.isFinite(minimum) && minimum > 0 ? minimum : 0,
      dueDate: new Date(dueDate).toISOString(),
      paidThisMonth: false,
      notes: '',
    });

    setLender('');
    setDescription('');
    setOriginalAmount('');
    setOutstandingAmount('');
    setMinimumPayment('');
    setDueDate(today());
  }

  const totalOutstanding = state.debts.reduce((total, debt) => total + debt.outstandingAmount, 0);
  const monthlyDue = state.debts.reduce((total, debt) => total + debt.minimumPayment, 0);

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <span className="eyebrow">What you owe</span>
          <h1>Debt Tracker</h1>
          <p>Track borrowed money, card dues, EMIs, and this month&apos;s minimum payments.</p>
        </div>
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <div className="stat-card__icon">
            <CircleDollarSign size={18} />
          </div>
          <p>Total outstanding</p>
          <strong>{currency(totalOutstanding)}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">
            <CircleDollarSign size={18} />
          </div>
          <p>Minimum due this month</p>
          <strong>{currency(monthlyDue)}</strong>
        </article>
      </div>

      <div className="content-grid content-grid--wide-left">
        <form className="panel form-panel" onSubmit={submit}>
          <label>
            Lender
            <input
              onChange={(event) => setLender(event.target.value)}
              placeholder="Bank, friend, credit card..."
              value={lender}
            />
          </label>
          <label>
            Description
            <input
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Personal loan, card bill, borrowed cash"
              value={description}
            />
          </label>
          <div className="form-row">
            <label>
              Original amount
              <input
                min="0"
                onChange={(event) => setOriginalAmount(event.target.value)}
                type="number"
                value={originalAmount}
              />
            </label>
            <label>
              Outstanding
              <input
                min="1"
                onChange={(event) => setOutstandingAmount(event.target.value)}
                type="number"
                value={outstandingAmount}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Minimum payment
              <input
                min="0"
                onChange={(event) => setMinimumPayment(event.target.value)}
                type="number"
                value={minimumPayment}
              />
            </label>
            <label>
              Due date
              <input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
            </label>
          </div>
          <button className="primary-button" type="submit">
            Add debt
          </button>
        </form>

        <article className="panel transaction-list-panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Ledger</span>
              <h2>Debts</h2>
            </div>
          </div>
          <div className="transaction-list">
            {state.debts.length === 0 && (
              <p className="muted-copy">No debts added. Add only money you actually owe.</p>
            )}
            {state.debts.map((debt) => (
              <div className="transaction-row" key={debt.id}>
                <div>
                  <strong>{debt.lender}</strong>
                  <span>
                    {debt.description || 'Debt'} - due {new Date(debt.dueDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="transaction-row__amount">
                  <span className="money-out">{currency(debt.outstandingAmount)}</span>
                  <button
                    className={debt.paidThisMonth ? 'status-pill status-pill--paid' : 'status-pill'}
                    onClick={() => toggleDebtPaid(debt.id)}
                    type="button"
                  >
                    {debt.paidThisMonth ? 'Paid' : `${currency(debt.minimumPayment)} due`}
                  </button>
                  <button
                    aria-label={`Delete ${debt.lender}`}
                    className="icon-button"
                    onClick={() => deleteDebt(debt.id)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
