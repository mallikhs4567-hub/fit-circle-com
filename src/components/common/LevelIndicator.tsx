import { cn } from '@/lib/utils';

interface LevelIndicatorProps {
  level?: number;
  className?: string;
}

export function LevelIndicator({ level = 1, className }: LevelIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary",
        className
      )}
    >
      LVL {level}
    </span>
  );
}
