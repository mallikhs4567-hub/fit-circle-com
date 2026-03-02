import { cn } from '@/lib/utils';
import { getLevel } from '@/hooks/useXP';
import { Zap } from 'lucide-react';

interface LevelIndicatorProps {
  xp?: number;
  className?: string;
}

export function LevelIndicator({ xp = 0, className }: LevelIndicatorProps) {
  const level = getLevel(xp);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary",
        className
      )}
    >
      <Zap className="w-3 h-3" />
      LVL {level}
    </span>
  );
}
