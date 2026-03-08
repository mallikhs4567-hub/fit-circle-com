import { Trophy, Zap, Clock, Flame, Target, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getXPMultiplier } from '@/lib/formAnalyzer';

interface WorkoutCompleteProps {
  exerciseName: string;
  reps: number;
  targetReps: number;
  avgFormScore: number;
  duration: number;
  xpEarned: number;
  calories: number;
  onClose: () => void;
}

export function WorkoutComplete({
  exerciseName, reps, targetReps, avgFormScore,
  duration, xpEarned, calories, onClose
}: WorkoutCompleteProps) {
  const multiplier = getXPMultiplier(avgFormScore);
  const isPerf = avgFormScore >= 90;
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 animate-fade-up">
      {/* Glow */}
      {isPerf && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-15 animate-pulse-glow"
            style={{ background: 'radial-gradient(circle, hsl(0 100% 59%), transparent)' }} />
        </div>
      )}

      <div className="card-elevated p-6 max-w-sm w-full space-y-5 text-center relative">
        {/* Trophy */}
        <div className={cn(
          "w-16 h-16 rounded-xl mx-auto flex items-center justify-center",
          isPerf ? "gradient-primary glow-primary" : "bg-secondary"
        )}>
          <Trophy className={cn("w-8 h-8", isPerf ? "text-primary-foreground" : "text-muted-foreground")} />
        </div>

        <div>
          <h2 className="text-xl font-display uppercase tracking-wide text-foreground">
            {isPerf ? 'Perfect Workout' : 'Workout Complete'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{exerciseName}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary rounded-lg p-3">
            <Target className="w-4 h-4 text-primary mx-auto mb-1.5" />
            <p className="stat-value text-xl text-foreground">{reps}/{targetReps}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Reps</p>
          </div>
          <div className="bg-secondary rounded-lg p-3">
            <Star className="w-4 h-4 text-streak mx-auto mb-1.5" />
            <p className={cn("stat-value text-xl", avgFormScore >= 90 ? "text-primary" : avgFormScore >= 75 ? "text-streak" : "text-destructive")}>
              {avgFormScore}%
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Form</p>
          </div>
          <div className="bg-secondary rounded-lg p-3">
            <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
            <p className="stat-value text-xl text-foreground">{mins}:{secs.toString().padStart(2, '0')}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Time</p>
          </div>
          <div className="bg-secondary rounded-lg p-3">
            <Flame className="w-4 h-4 text-destructive mx-auto mb-1.5" />
            <p className="stat-value text-xl text-foreground">{calories}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Cal</p>
          </div>
        </div>

        {/* XP */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="stat-value text-2xl text-primary">+{xpEarned} XP</span>
          {multiplier > 1 && (
            <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              {multiplier}x
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-lg gradient-primary text-primary-foreground font-bold text-sm uppercase tracking-wider press-effect"
        >
          Done
        </button>
      </div>
    </div>
  );
}
