import { FormEvent, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useFinance } from '../../app/FinanceProvider';
import { expenseCategories, incomeCategories, paymentModes } from '../../core/constants/options';
import type { MoneyTransaction, TransactionType } from '../../domain/entities/finance';
import { currency } from '../../domain/services/financeCalculations';

const today = () => new Date().toISOString().slice(0, 10);

export function Transactions() {
  const { state, addTransaction, deleteTransaction } = useFinance();
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('Food');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');

  const categoryOptions = type === 'expense' ? expenseCategories : incomeCategories;
  const sortedTransactions = useMemo(
    () =>
      [...state.transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [state.transactions],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    addTransaction({
      title: title.trim(),
      amount: parsedAmount,
      category: category as MoneyTransaction['category'],
      date: new Date(date).toISOString(),
      paymentMode: paymentMode as MoneyTransaction['paymentMode'],
      type,
      notes: notes.trim(),
      tags: [],
      recurring: false,
    });

    setTitle('');
    setAmount('');
    setNotes('');
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <span className="eyebrow">Money in motion</span>
          <h1>Transactions</h1>
          <p>Add expenses or income in under ten seconds.</p>
        </div>
      </header>

      <div className="content-grid content-grid--wide-left">
        <form className="panel form-panel" onSubmit={submit}>
          <div className="segmented-control">
            <button
              className={type === 'expense' ? 'is-selected' : ''}
              onClick={() => {
                setType('expense');
                setCategory('Food');
              }}
              type="button"
            >
              Expense
            </button>
            <button
              className={type === 'income' ? 'is-selected' : ''}
              onClick={() => {
                setType('income');
                setCategory('Salary');
              }}
              type="button"
            >
              Income
            </button>
          </div>

          <label>
            Title
            <input
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Coffee, rent, salary..."
              value={title}
            />
          </label>

          <label>
            Amount
            <input
              min="1"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              type="number"
              value={amount}
            />
          </label>

          <div className="form-row">
            <label>
              Category
              <select onChange={(event) => setCategory(event.target.value)} value={category}>
                {categoryOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              Payment
              <select onChange={(event) => setPaymentMode(event.target.value)} value={paymentMode}>
                {paymentModes.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Date
            <input onChange={(event) => setDate(event.target.value)} type="date" value={date} />
          </label>

          <label>
            Notes
            <textarea
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional context"
              value={notes}
            />
          </label>

          <button className="primary-button" type="submit">
            Save transaction
          </button>
        </form>

        <article className="panel transaction-list-panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Ledger</span>
              <h2>Recent Activity</h2>
            </div>
          </div>
          <div className="transaction-list">
            {sortedTransactions.map((transaction) => (
              <div className="transaction-row" key={transaction.id}>
                <div>
                  <strong>{transaction.title}</strong>
                  <span>
                    {transaction.category} · {new Date(transaction.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="transaction-row__amount">
                  <span className={transaction.type === 'income' ? 'money-in' : 'money-out'}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {currency(transaction.amount)}
                  </span>
                  <button
                    aria-label={`Delete ${transaction.title}`}
                    className="icon-button"
                    onClick={() => deleteTransaction(transaction.id)}
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
