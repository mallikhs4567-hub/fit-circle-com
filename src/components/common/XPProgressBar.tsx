import { Progress } from '@/components/ui/progress';
import { getLevel, getXPInCurrentLevel } from '@/hooks/useXP';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface XPProgressBarProps {
  xp: number;
  className?: string;
}

export function XPProgressBar({ xp, className }: XPProgressBarProps) {
  const level = getLevel(xp);
  const current = getXPInCurrentLevel(xp);

  return (
    <div className={cn('w-full max-w-[200px]', className)}>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span className="flex items-center gap-0.5">
          <Zap className="w-3 h-3 text-primary" />
          {current}/100 XP
        </span>
        <span>LVL {level + 1}</span>
      </div>
      <Progress value={current} className="h-1.5" />
    </div>
  );
}
