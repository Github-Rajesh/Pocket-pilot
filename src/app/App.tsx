import { useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  CircleDollarSign,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Settings,
  WalletCards,
} from 'lucide-react';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Transactions } from '../features/transactions/Transactions';
import { Goals } from '../features/goals/Goals';
import { Debts } from '../features/debts/Debts';
import { Analytics } from '../features/analytics/Analytics';
import { Assistant } from '../features/assistant/Assistant';
import { SettingsPanel } from '../features/settings/SettingsPanel';

type SectionId =
  | 'dashboard'
  | 'transactions'
  | 'goals'
  | 'debts'
  | 'analytics'
  | 'assistant'
  | 'settings';

const sections = [
  { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
  { id: 'transactions', label: 'Money', icon: ReceiptText },
  { id: 'goals', label: 'Goals', icon: PiggyBank },
  { id: 'debts', label: 'Debts', icon: CircleDollarSign },
  { id: 'analytics', label: 'Map', icon: BarChart3 },
  { id: 'assistant', label: 'AI', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
] satisfies Array<{ id: SectionId; label: string; icon: typeof WalletCards }>;

export function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const activeContent = useMemo(() => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} />;
      case 'transactions':
        return <Transactions />;
      case 'goals':
        return <Goals />;
      case 'debts':
        return <Debts />;
      case 'analytics':
        return <Analytics onNavigate={setActiveSection} />;
      case 'assistant':
        return <Assistant />;
      case 'settings':
        return <SettingsPanel />;
    }
  }, [activeSection]);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <div className="brand__mark">
            <WalletCards size={24} />
          </div>
          <div>
            <strong>Pocket Pilot</strong>
            <span>Financial OS</span>
          </div>
        </div>

        <nav className="nav-list">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                className={section.id === activeSection ? 'nav-item nav-item--active' : 'nav-item'}
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                type="button"
              >
                <Icon size={19} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main-panel">{activeContent}</main>

      <nav className="mobile-nav" aria-label="Mobile primary">
        {sections.filter((section) => section.id !== 'settings').map((section) => {
          const Icon = section.icon;
          return (
            <button
              aria-label={section.label}
              className={section.id === activeSection ? 'mobile-nav__item is-active' : 'mobile-nav__item'}
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              <Icon size={20} />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
