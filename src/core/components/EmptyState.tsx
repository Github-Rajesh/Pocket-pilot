import type { ReactNode } from 'react';

export function EmptyState({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="empty-state">
      <div>{icon}</div>
      <p>{title}</p>
    </div>
  );
}
