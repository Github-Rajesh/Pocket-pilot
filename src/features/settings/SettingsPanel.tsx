import { FormEvent, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useFinance } from '../../app/FinanceProvider';

export function SettingsPanel() {
  const { state, updateSalary, updateSalaryAdjustment, updateFixedExpense, resetData } = useFinance();
  const [salary, setSalary] = useState(String(state.profile.monthlySalary));
  const [salaryAdjustment, setSalaryAdjustment] = useState(
    String(state.profile.salaryAdjustmentThisMonth),
  );
  const [fixedExpenses, setFixedExpenses] = useState(
    state.profile.fixedExpenses.map((expense) => ({
      id: expense.id,
      amount: String(expense.amount),
      dueDay: String(expense.dueDay),
      paidThisMonth: expense.paidThisMonth,
    })),
  );

  useEffect(() => {
    setSalary(String(state.profile.monthlySalary));
    setSalaryAdjustment(String(state.profile.salaryAdjustmentThisMonth));
    setFixedExpenses(
      state.profile.fixedExpenses.map((expense) => ({
        id: expense.id,
        amount: String(expense.amount),
        dueDay: String(expense.dueDay),
        paidThisMonth: expense.paidThisMonth,
      })),
    );
  }, [state.profile]);

  function submit(event: FormEvent) {
    event.preventDefault();
    updateSalary(Number(salary));
    updateSalaryAdjustment(Number(salaryAdjustment));
    fixedExpenses.forEach((expense) => {
      updateFixedExpense(
        expense.id,
        Number(expense.amount),
        Number(expense.dueDay),
        expense.paidThisMonth,
      );
    });
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <span className="eyebrow">Control room</span>
          <h1>Settings</h1>
          <p>Keep salary and fixed commitments configurable.</p>
        </div>
      </header>

      <form className="panel form-panel settings-form" onSubmit={submit}>
        <label>
          Base monthly salary
          <input
            min="0"
            onChange={(event) => setSalary(event.target.value)}
            type="number"
            value={salary}
          />
        </label>

        <label>
          This month adjustment
          <input
            onChange={(event) => setSalaryAdjustment(event.target.value)}
            placeholder="Use negative for loss of pay"
            type="number"
            value={salaryAdjustment}
          />
        </label>

        <div className="settings-list">
          {state.profile.fixedExpenses.map((expense, index) => {
            const draft = fixedExpenses[index];
            return (
              <div className="settings-expense" key={expense.id}>
                <strong>{expense.name}</strong>
                <div className="form-row">
                  <label>
                    Amount
                    <input
                      min="0"
                      onChange={(event) =>
                        setFixedExpenses((current) =>
                          current.map((item) =>
                            item.id === expense.id
                              ? { ...item, amount: event.target.value }
                              : item,
                          ),
                        )
                      }
                      type="number"
                      value={draft.amount}
                    />
                  </label>
                  <label>
                    Due day
                    <input
                      max="28"
                      min="1"
                      onChange={(event) =>
                        setFixedExpenses((current) =>
                          current.map((item) =>
                            item.id === expense.id
                              ? { ...item, dueDay: event.target.value }
                              : item,
                          ),
                        )
                      }
                      type="number"
                      value={draft.dueDay}
                    />
                  </label>
                </div>
                <label className="checkbox-row">
                  <input
                    checked={draft.paidThisMonth}
                    onChange={(event) =>
                      setFixedExpenses((current) =>
                        current.map((item) =>
                          item.id === expense.id
                            ? { ...item, paidThisMonth: event.target.checked }
                            : item,
                        ),
                      )
                    }
                    type="checkbox"
                  />
                  Paid this month
                </label>
              </div>
            );
          })}
        </div>

        <div className="settings-actions">
          <button className="primary-button" type="submit">
            Save settings
          </button>
          <button className="secondary-button" onClick={resetData} type="button">
            <RotateCcw size={16} />
            Reset data
          </button>
        </div>
      </form>
    </section>
  );
}
