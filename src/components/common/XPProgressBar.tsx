import { getLevel, getXPInCurrentLevel } from '@/hooks/useXP';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface XPProgressBarProps {
  xp: number;
  className?: string;
  compact?: boolean;
}

export function XPProgressBar({ xp, className, compact = false }: XPProgressBarProps) {
  const level = getLevel(xp);
  const current = getXPInCurrentLevel(xp);

  if (compact) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        </div>
        <div className="mt-2">
          <p className="stat-value text-xl text-foreground">{current}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">XP · L{level + 1}</p>
        </div>
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-2">
          <div
            className="h-full rounded-full gradient-primary transition-all duration-500"
            style={{ width: `${current}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full max-w-[200px]', className)}>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span className="flex items-center gap-0.5">
          <Zap className="w-3 h-3 text-primary" />
          {current}/100 XP
        </span>
        <span className="uppercase tracking-wider font-semibold">LVL {level + 1}</span>
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full gradient-primary transition-all duration-500"
          style={{ width: `${current}%` }}
        />
      </div>
    </div>
  );
}
