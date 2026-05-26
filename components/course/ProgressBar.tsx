"use client";

interface ProgressBarProps {
  viewed: number;
  total: number;
  completed?: number;
}

export function ProgressBar({ viewed, total, completed }: ProgressBarProps) {
  if (total === 0) return null;
  const pct = Math.round((viewed / total) * 100);
  const completedPct = completed ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {viewed}/{total} viewed
          {completed !== undefined && ` · ${completed} completed`}
        </span>
        <span className="font-medium text-foreground tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
