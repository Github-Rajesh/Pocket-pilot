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
      return JSON.parse(raw) as FinanceState;
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
