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
      {/* Confetti-like glow */}
      {isPerf && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-20 animate-pulse-glow"
            style={{ background: 'radial-gradient(circle, hsl(82 85% 55%), transparent)' }} />
        </div>
      )}

      <div className="card-elevated p-6 max-w-sm w-full space-y-5 text-center relative">
        {/* Trophy */}
        <div className={cn(
          "w-16 h-16 rounded-full mx-auto flex items-center justify-center",
          isPerf ? "gradient-primary glow-primary" : "bg-secondary"
        )}>
          <Trophy className={cn("w-8 h-8", isPerf ? "text-primary-foreground" : "text-muted-foreground")} />
        </div>

        <div>
          <h2 className="text-xl font-display font-bold text-foreground">
            {isPerf ? '🔥 Perfect Workout!' : 'Workout Complete!'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{exerciseName}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary rounded-xl p-3">
            <Target className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-display font-bold text-foreground">{reps}/{targetReps}</p>
            <p className="text-[10px] text-muted-foreground">Reps</p>
          </div>
          <div className="bg-secondary rounded-xl p-3">
            <Star className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className={cn("text-lg font-display font-bold", avgFormScore >= 90 ? "text-primary" : avgFormScore >= 75 ? "text-accent" : "text-destructive")}>
              {avgFormScore}%
            </p>
            <p className="text-[10px] text-muted-foreground">Form</p>
          </div>
          <div className="bg-secondary rounded-xl p-3">
            <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-display font-bold text-foreground">{mins}:{secs.toString().padStart(2, '0')}</p>
            <p className="text-[10px] text-muted-foreground">Time</p>
          </div>
          <div className="bg-secondary rounded-xl p-3">
            <Flame className="w-4 h-4 text-destructive mx-auto mb-1" />
            <p className="text-lg font-display font-bold text-foreground">{calories}</p>
            <p className="text-[10px] text-muted-foreground">Calories</p>
          </div>
        </div>

        {/* XP earned */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-lg font-display font-bold text-primary">+{xpEarned} XP</span>
          {multiplier > 1 && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {multiplier}x bonus
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
