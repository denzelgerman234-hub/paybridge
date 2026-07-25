import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  showPercent?: boolean;
  label?: string;
  className?: string;
  color?: 'primary' | 'green' | 'amber';
}

const colors = {
  primary: 'linear-gradient(90deg, #C9A84C, #d946ef)',
  green:   'linear-gradient(90deg, #10b981, #34d399)',
  amber:   'linear-gradient(90deg, #f59e0b, #fbbf24)',
};

export function ProgressBar({ value, max = 100, showPercent, label, className, color = 'primary' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs text-cream/50">
          {label && <span>{label}</span>}
          {showPercent && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: colors[color] }}
        />
      </div>
    </div>
  );
}
