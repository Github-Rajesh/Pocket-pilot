import type { FinanceState } from '../../domain/entities/finance';
import { seedFinanceState } from '../../domain/seedFinanceState';

const storageKey = 'pocket-pilot-finance-state-v1';

export class FinanceRepository {
  load(): FinanceState {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return seedFinanceState;
    }

    try {
      return normalizeState(JSON.parse(raw) as Partial<FinanceState>);
    } catch {
      return seedFinanceState;
    }
  }

  save(state: FinanceState) {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }

  reset() {
    window.localStorage.removeItem(storageKey);
    return seedFinanceState;
  }
}

function normalizeState(value: Partial<FinanceState>): FinanceState {
  const schemaVersion = value.schemaVersion ?? 1;
  const profile = {
    ...seedFinanceState.profile,
    ...value.profile,
    salaryAdjustmentThisMonth: value.profile?.salaryAdjustmentThisMonth ?? 0,
    fixedExpenses:
      value.profile?.fixedExpenses?.map((expense) => ({
        ...expense,
        paidThisMonth: schemaVersion < 2 ? false : expense.paidThisMonth,
      })) ?? seedFinanceState.profile.fixedExpenses,
  };

  return {
    schemaVersion: 2,
    profile,
    transactions: value.transactions ?? seedFinanceState.transactions,
    goals: (value.goals ?? seedFinanceState.goals).map((goal) => {
      if (schemaVersion >= 2) {
        return goal;
      }

      if (['emergency-fund', 'gaming-laptop', 'singapore-trip'].includes(goal.id)) {
        return {
          ...goal,
          currentSavings: 0,
          monthlyContribution: 0,
        };
      }

      return goal;
    }),
    creditCards: value.creditCards ?? seedFinanceState.creditCards,
  };
}
