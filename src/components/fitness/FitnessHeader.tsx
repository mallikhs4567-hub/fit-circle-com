import { useState, useEffect } from 'react';
import { StreakBadge } from '@/components/common/StreakBadge';
import { XPProgressBar } from '@/components/common/XPProgressBar';
import { Flame, Dumbbell, Check } from 'lucide-react';
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
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const greeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <header className="px-4 pt-6 pb-3 space-y-4">
      {/* Top row */}
      <div className="flex items-center justify-between animate-stagger-in">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{greeting()} Session</p>
            <span className="text-[10px] text-muted-foreground/60 tabular-nums">{timeStr}</span>
          </div>
          <h1 className="text-2xl font-display text-foreground mt-0.5">{username}</h1>
        </div>
        <StreakBadge streak={streak} size="md" animate={bothDone} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Today's Progress */}
        <div className="card-elevated p-3 space-y-2 animate-stagger-in" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center transition-all duration-500",
              bothDone ? "gradient-primary glow-primary" : "bg-secondary"
            )}>
              {bothDone ? (
                <Check className="w-3.5 h-3.5 text-primary-foreground" />
              ) : (
                <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
          <div>
            <p className="stat-value text-xl text-foreground">{completionCount}/2</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Tasks</p>
          </div>
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                bothDone ? "gradient-primary progress-bar-animated" : "bg-primary/70"
              )}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="card-elevated p-3 space-y-2 animate-stagger-in" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center">
              <Flame className={cn("w-3.5 h-3.5 text-streak", streak > 0 && "animate-breathing")} />
            </div>
          </div>
          <div>
            <p className="stat-value text-xl text-foreground">{streak}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Streak</p>
          </div>
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-streak transition-all duration-700" style={{ width: `${Math.min(streak * 14, 100)}%` }} />
          </div>
        </div>

        {/* XP */}
        <div className="card-elevated p-3 space-y-2 animate-stagger-in" style={{ animationDelay: '240ms' }}>
          <XPProgressBar xp={xp} compact />
        </div>
      </div>
    </header>
  );
}
