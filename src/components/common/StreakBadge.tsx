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
    md: 'text-lg gap-1.5',
    lg: 'text-2xl gap-2',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  if (streak === 0) {
    return (
      <div className={cn("flex items-center text-muted-foreground", sizeClasses[size])}>
        <Flame className={cn(iconSizes[size], "opacity-50")} />
        {showLabel && <span className="font-semibold">0</span>}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center text-streak font-bold",
      sizeClasses[size],
      animate && "animate-streak-pulse"
    )}>
      <Flame className={cn(
        iconSizes[size],
        "fill-streak text-streak",
        animate && "drop-shadow-[0_0_8px_hsl(var(--streak-fire))]"
      )} />
      <span className={cn(
        animate && "text-gradient-accent"
      )}>
        {streak}
      </span>
      {showLabel && size !== 'sm' && (
        <span className="text-muted-foreground font-medium text-sm ml-0.5">
          {streak === 1 ? 'day' : 'days'}
        </span>
      )}
    </div>
  );
}
