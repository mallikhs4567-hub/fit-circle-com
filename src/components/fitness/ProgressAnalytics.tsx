import { Trophy, Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressAnalyticsProps {
  streak: number;
  totalActiveDays: number;
  weekData: { date: string; completed: boolean }[];
  leaderboard: { username: string; xp: number }[];
}

export function ProgressAnalytics({ streak, totalActiveDays, weekData, leaderboard }: ProgressAnalyticsProps) {
  const weeklyConsistency = weekData.length
    ? Math.round((weekData.filter(d => d.completed).length / weekData.length) * 100)
    : 0;

  return (
    <div className="space-y-3">
      <h2 className="section-header">Progress</h2>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card-elevated p-3 text-center">
          <Flame className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="text-lg font-display font-bold text-foreground">{streak}</p>
          <p className="text-[10px] text-muted-foreground">Streak</p>
        </div>
        <div className="card-elevated p-3 text-center">
          <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-display font-bold text-foreground">{totalActiveDays}</p>
          <p className="text-[10px] text-muted-foreground">Active Days</p>
        </div>
        <div className="card-elevated p-3 text-center">
          <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" />
          <p className="text-lg font-display font-bold text-foreground">{weeklyConsistency}%</p>
          <p className="text-[10px] text-muted-foreground">Weekly</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card-elevated p-3">
        <p className="text-[10px] text-muted-foreground mb-2">This Week</p>
        <div className="flex gap-1.5">
          {weekData.map((d, i) => {
            const dayLabel = new Date(d.date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={cn(
                  "w-full aspect-square rounded-lg transition-all",
                  d.completed ? "bg-primary/50" : "bg-secondary"
                )} />
                <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard top 3 */}
      {leaderboard.length > 0 && (
        <div className="card-elevated p-3">
          <p className="text-[10px] text-muted-foreground mb-2">Weekly Leaderboard</p>
          <div className="space-y-2">
            {leaderboard.slice(0, 3).map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                  i === 0 ? "bg-primary text-primary-foreground" :
                  i === 1 ? "bg-accent text-accent-foreground" :
                  "bg-secondary text-muted-foreground"
                )}>
                  {i + 1}
                </span>
                <span className="flex-1 text-xs text-foreground truncate">{entry.username}</span>
                <span className="text-xs font-semibold text-primary">{entry.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
