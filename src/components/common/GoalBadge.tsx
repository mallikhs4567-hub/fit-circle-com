import { cn } from '@/lib/utils';
import { Target, Dumbbell, Salad, Footprints, Sparkles } from 'lucide-react';

const goalConfig: Record<string, { label: string; icon: typeof Target }> = {
  'weight-loss': { label: 'Weight Loss', icon: Target },
  'muscle-gain': { label: 'Muscle Gain', icon: Dumbbell },
  'yoga': { label: 'Yoga', icon: Sparkles },
  'runner': { label: 'Runner', icon: Footprints },
  'general-fitness': { label: 'General Fitness', icon: Salad },
  'healthy-routine': { label: 'Healthy Routine', icon: Salad },
};

interface GoalBadgeProps {
  goal: string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

export function GoalBadge({ goal, size = 'sm', className }: GoalBadgeProps) {
  if (!goal) return null;

  const config = goalConfig[goal];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/50 text-primary font-medium",
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
}
