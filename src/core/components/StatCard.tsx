import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  tone?: 'default' | 'good' | 'warning' | 'danger';
  icon?: ReactNode;
}

export function StatCard({ label, value, tone = 'default', icon }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
