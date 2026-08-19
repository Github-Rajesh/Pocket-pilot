import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type {
  CreditCardAccount,
  Debt,
  ExpenseCategory,
  FinanceState,
  Goal,
  MoneyTransaction,
} from '../domain/entities/finance';
import { seedFinanceState } from '../domain/seedFinanceState';
import { FinanceRepository } from '../core/storage/financeRepository';
import { monthKey } from '../domain/services/financeCalculations';

type FinanceAction =
  | { type: 'add-transaction'; payload: MoneyTransaction }
  | { type: 'delete-transaction'; payload: string }
  | { type: 'add-goal'; payload: Goal }
  | { type: 'add-debt'; payload: Debt }
  | { type: 'delete-debt'; payload: string }
  | { type: 'toggle-debt-paid'; payload: string }
  | { type: 'update-credit-card'; payload: CreditCardAccount }
  | { type: 'mark-credit-card-paid'; payload: { id: string; amount: number } }
  | { type: 'update-salary'; payload: number }
  | { type: 'update-salary-adjustment'; payload: number }
  | {
      type: 'update-fixed-expense';
      payload: { id: string; amount: number; dueDay: number; paidThisMonth: boolean };
    }
  | { type: 'reset' };

interface FinanceContextValue {
  state: FinanceState;
  addTransaction: (transaction: Omit<MoneyTransaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  deleteDebt: (id: string) => void;
  toggleDebtPaid: (id: string) => void;
  updateCreditCard: (card: CreditCardAccount) => void;
  markCreditCardPaid: (id: string, amount: number) => void;
  updateSalary: (salary: number) => void;
  updateSalaryAdjustment: (amount: number) => void;
  updateFixedExpense: (
    id: string,
    amount: number,
    dueDay: number,
    paidThisMonth: boolean,
  ) => void;
  toggleFixedExpensePaid: (id: string) => void;
  resetData: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);
const repository = new FinanceRepository();

function reducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'add-transaction':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        creditCards:
          action.payload.type === 'expense' && action.payload.paymentMode === 'Credit Card'
            ? state.creditCards.map((card) => ({ ...card, paidThisMonth: false }))
            : state.creditCards,
      };
    case 'delete-transaction':
      return {
        ...state,
        transactions: state.transactions.filter((transaction) => transaction.id !== action.payload),
      };
    case 'add-goal':
      return {
        ...state,
        goals: [action.payload, ...state.goals],
      };
    case 'add-debt':
      return {
        ...state,
        debts: [action.payload, ...state.debts],
      };
    case 'delete-debt':
      return {
        ...state,
        debts: state.debts.filter((debt) => debt.id !== action.payload),
      };
    case 'toggle-debt-paid':
      return {
        ...state,
        debts: state.debts.map((debt) =>
          debt.id === action.payload
            ? {
                ...debt,
                paidThisMonth: !debt.paidThisMonth,
              }
            : debt,
        ),
      };
    case 'update-credit-card':
      return {
        ...state,
        creditCards: state.creditCards.map((card) =>
          card.id === action.payload.id ? action.payload : card,
        ),
      };
    case 'mark-credit-card-paid':
      return {
        ...state,
        creditCards: state.creditCards.map((card) =>
          card.id === action.payload.id
            ? {
                ...card,
                paidAmountThisMonth: action.payload.amount,
                paidMonthKey: monthKey(),
                paidThisMonth: true,
              }
            : card,
        ),
      };
    case 'update-salary':
      return {
        ...state,
        profile: {
          ...state.profile,
          monthlySalary: action.payload,
        },
      };
    case 'update-salary-adjustment':
      return {
        ...state,
        profile: {
          ...state.profile,
          salaryAdjustmentThisMonth: action.payload,
        },
      };
    case 'update-fixed-expense':
      return {
        ...state,
        profile: {
          ...state.profile,
          fixedExpenses: state.profile.fixedExpenses.map((expense) =>
            expense.id === action.payload.id
              ? {
                  ...expense,
                  amount: action.payload.amount,
                  dueDay: action.payload.dueDay,
                  paidThisMonth: action.payload.paidThisMonth,
                }
              : expense,
          ),
        },
      };
    case 'reset':
      return seedFinanceState;
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => repository.load());

  useEffect(() => {
    repository.save(state);
  }, [state]);

  const value = useMemo<FinanceContextValue>(
    () => ({
      state,
      addTransaction(transaction) {
        dispatch({
          type: 'add-transaction',
          payload: {
            ...transaction,
            id: crypto.randomUUID(),
            category: transaction.category as ExpenseCategory,
          },
        });
      },
      deleteTransaction(id) {
        dispatch({ type: 'delete-transaction', payload: id });
      },
      addGoal(goal) {
        dispatch({
          type: 'add-goal',
          payload: {
            ...goal,
            id: crypto.randomUUID(),
          },
        });
      },
      addDebt(debt) {
        dispatch({
          type: 'add-debt',
          payload: {
            ...debt,
            id: crypto.randomUUID(),
          },
        });
      },
      deleteDebt(id) {
        dispatch({ type: 'delete-debt', payload: id });
      },
      toggleDebtPaid(id) {
        dispatch({ type: 'toggle-debt-paid', payload: id });
      },
      updateCreditCard(card) {
        dispatch({ type: 'update-credit-card', payload: card });
      },
      markCreditCardPaid(id, amount) {
        dispatch({ type: 'mark-credit-card-paid', payload: { id, amount } });
      },
      updateSalary(salary) {
        dispatch({ type: 'update-salary', payload: salary });
      },
      updateSalaryAdjustment(amount) {
        dispatch({ type: 'update-salary-adjustment', payload: amount });
      },
      updateFixedExpense(id, amount, dueDay, paidThisMonth) {
        dispatch({
          type: 'update-fixed-expense',
          payload: { id, amount, dueDay, paidThisMonth },
        });
      },
      toggleFixedExpensePaid(id) {
        const expense = state.profile.fixedExpenses.find((item) => item.id === id);

        if (!expense) {
          return;
        }

        dispatch({
          type: 'update-fixed-expense',
          payload: {
            id,
            amount: expense.amount,
            dueDay: expense.dueDay,
            paidThisMonth: !expense.paidThisMonth,
          },
        });
      },
      resetData() {
        repository.reset();
        dispatch({ type: 'reset' });
      },
    }),
    [state],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error('useFinance must be used inside FinanceProvider');
  }

  return context;
}
