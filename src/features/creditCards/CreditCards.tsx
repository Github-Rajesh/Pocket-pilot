import { FormEvent, useMemo, useState } from 'react';
import { CreditCard, IndianRupee } from 'lucide-react';
import { useFinance } from '../../app/FinanceProvider';
import { ProgressBar } from '../../core/components/ProgressBar';
import {
  creditCardCycleSpend,
  creditCardPayable,
  currency,
  currentMonthTransactions,
  isCreditCardExpense,
  monthKey,
} from '../../domain/services/financeCalculations';

export function CreditCards() {
  const { state, updateCreditCard, markCreditCardPaid } = useFinance();
  const card = state.creditCards[0];
  const [limit, setLimit] = useState(String(card.limit));
  const [openingOutstanding, setOpeningOutstanding] = useState(String(card.currentUsage));
  const [statementDay, setStatementDay] = useState(String(card.statementDay));
  const [dueDay, setDueDay] = useState(String(card.dueDay));
  const cycleSpend = creditCardCycleSpend(state.transactions);
  const payable = creditCardPayable(state);
  const paidForThisMonth = card.paidThisMonth && card.paidMonthKey === monthKey();
  const utilization = card.limit <= 0 ? 0 : payable / card.limit;
  const cardTransactions = useMemo(
    () =>
      currentMonthTransactions(state.transactions)
        .filter(isCreditCardExpense)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.transactions],
  );

  function saveSettings(event: FormEvent) {
    event.preventDefault();
    updateCreditCard({
      ...card,
      limit: Number(limit),
      currentUsage: Number(openingOutstanding),
      outstanding: Number(openingOutstanding),
      statementDay: Number(statementDay),
      dueDay: Number(dueDay),
    });
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <span className="eyebrow">Monthly card cycle</span>
          <h1>Credit Card</h1>
          <p>Track your own card separately from your brother&apos;s fixed EMI.</p>
        </div>
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <div className="stat-card__icon">
            <CreditCard size={18} />
          </div>
          <p>Card limit</p>
          <strong>{currency(card.limit)}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">
            <IndianRupee size={18} />
          </div>
          <p>This month on card</p>
          <strong>{currency(cycleSpend)}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">
            <IndianRupee size={18} />
          </div>
          <p>Payable now</p>
          <strong>{currency(payable)}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">
            <CreditCard size={18} />
          </div>
          <p>Status</p>
          <strong>{paidForThisMonth && payable === 0 ? 'Paid' : 'Unpaid'}</strong>
        </article>
      </div>

      <div className="content-grid content-grid--wide-left">
        <form className="panel form-panel" onSubmit={saveSettings}>
          <ProgressBar label="Utilization" value={utilization} />
          <label>
            Limit
            <input min="1" onChange={(event) => setLimit(event.target.value)} type="number" value={limit} />
          </label>
          <label>
            Opening outstanding
            <input
              min="0"
              onChange={(event) => setOpeningOutstanding(event.target.value)}
              type="number"
              value={openingOutstanding}
            />
          </label>
          <div className="form-row">
            <label>
              Statement day
              <input
                max="28"
                min="1"
                onChange={(event) => setStatementDay(event.target.value)}
                type="number"
                value={statementDay}
              />
            </label>
            <label>
              Pay day
              <input
                max="28"
                min="1"
                onChange={(event) => setDueDay(event.target.value)}
                type="number"
                value={dueDay}
              />
            </label>
          </div>
          <button className="primary-button" type="submit">
            Save card settings
          </button>
          <button
            className="secondary-button"
            disabled={payable === 0}
            onClick={() => markCreditCardPaid(card.id, card.currentUsage + cycleSpend)}
            type="button"
          >
            Mark payable as paid
          </button>
        </form>

        <article className="panel transaction-list-panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Spend source</span>
              <h2>Credit Card Transactions</h2>
            </div>
          </div>
          <div className="transaction-list">
            {cardTransactions.length === 0 && (
              <p className="muted-copy">
                Add expenses in Money and choose Credit Card as the payment mode.
              </p>
            )}
            {cardTransactions.map((transaction) => (
              <div className="transaction-row" key={transaction.id}>
                <div>
                  <strong>{transaction.title}</strong>
                  <span>
                    {transaction.category} - {new Date(transaction.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="transaction-row__amount">
                  <span className="money-out">{currency(transaction.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
