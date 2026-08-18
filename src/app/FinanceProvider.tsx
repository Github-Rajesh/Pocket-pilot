import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type {
  ExpenseCategory,
  FinanceState,
  Goal,
  MoneyTransaction,
} from '../domain/entities/finance';
import { seedFinanceState } from '../domain/seedFinanceState';
import { FinanceRepository } from '../core/storage/financeRepository';

type FinanceAction =
  | { type: 'add-transaction'; payload: MoneyTransaction }
  | { type: 'delete-transaction'; payload: string }
  | { type: 'add-goal'; payload: Goal }
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
