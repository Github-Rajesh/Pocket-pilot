interface ProgressBarProps {
  value: number;
  label: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const normalized = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <div className="progress" aria-label={`${label}: ${normalized}%`}>
      <div className="progress__meta">
        <span>{label}</span>
        <span>{normalized}%</span>
      </div>
      <div className="progress__track">
        <span style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}
