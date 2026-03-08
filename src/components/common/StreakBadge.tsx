import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

export function StreakBadge({ streak, size = 'md', showLabel = true, animate = false }: StreakBadgeProps) {
  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-1.5',
    lg: 'text-2xl gap-2',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const containerSizes = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2',
  };

  if (streak === 0) {
    return (
      <div className={cn(
        "flex items-center text-muted-foreground rounded-lg bg-secondary",
        sizeClasses[size], containerSizes[size]
      )}>
        <Flame className={cn(iconSizes[size], "opacity-40")} />
        {showLabel && <span className="stat-value">0</span>}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center rounded-lg border border-streak/20",
      sizeClasses[size], containerSizes[size],
      animate && "animate-streak-pulse glow-streak",
      "bg-streak/10"
    )}>
      <Flame className={cn(
        iconSizes[size],
        "fill-streak text-streak",
        animate && "drop-shadow-[0_0_6px_hsl(var(--streak-fire))]"
      )} />
      <span className="stat-value text-streak">{streak}</span>
      {showLabel && size !== 'sm' && (
        <span className="text-streak/60 text-xs uppercase tracking-wider ml-0.5">day{streak !== 1 ? 's' : ''}</span>
      )}
    </div>
  );
}
