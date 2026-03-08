import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function PremiumBadge({ className, size = 'sm' }: PremiumBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full bg-primary/20 text-primary font-bold",
      size === 'sm' ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-xs",
      "animate-pulse-slow",
      className,
    )}>
      <Crown className={size === 'sm' ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
      PRO
    </span>
  );
}
