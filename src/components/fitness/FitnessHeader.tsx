import { StreakBadge } from '@/components/common/StreakBadge';
import { XPProgressBar } from '@/components/common/XPProgressBar';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FitnessHeaderProps {
  username: string;
  streak: number;
  xp: number;
  workoutDone: boolean;
  dietDone: boolean;
}

export function FitnessHeader({ username, streak, xp, workoutDone, dietDone }: FitnessHeaderProps) {
  const completionCount = (workoutDone ? 1 : 0) + (dietDone ? 1 : 0);
  const completionPercent = (completionCount / 2) * 100;
  const bothDone = workoutDone && dietDone;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="px-4 pt-6 pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs">{greeting()}</p>
          <h1 className="text-xl font-display font-bold text-foreground">{username}</h1>
        </div>
        <StreakBadge streak={streak} size="md" animate={bothDone} />
      </div>

      {/* Today's progress */}
      <div className="card-elevated p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Today's Progress</span>
          <span className="text-xs font-semibold text-primary">{completionPercent}%</span>
        </div>
        <Progress value={completionPercent} className="h-2" />
        <div className="flex items-center justify-between">
          <XPProgressBar xp={xp} className="max-w-[140px]" />
          {bothDone && (
            <div className="flex items-center gap-1 text-xs text-primary animate-fade-up">
              <Trophy className="w-3.5 h-3.5" />
              <span>Day Complete!</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
