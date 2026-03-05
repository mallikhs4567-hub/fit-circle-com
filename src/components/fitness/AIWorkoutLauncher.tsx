import { useState } from 'react';
import { Camera, Zap, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXERCISE_LIBRARY, type ExerciseConfig } from '@/lib/repCounter';
import { AIWorkoutSession } from '@/components/ai-workout/AIWorkoutSession';

type CategoryFilter = 'all' | 'upper' | 'lower' | 'full' | 'cardio';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  upper: 'Upper Body',
  lower: 'Lower Body',
  full: 'Full Body',
  cardio: 'Cardio',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-primary bg-primary/10',
  intermediate: 'text-accent bg-accent/10',
  advanced: 'text-destructive bg-destructive/10',
};

export function AIWorkoutLauncher() {
  const [expanded, setExpanded] = useState(false);
  const [activeExercise, setActiveExercise] = useState<ExerciseConfig | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>('all');

  if (activeExercise) {
    return (
      <AIWorkoutSession
        exercise={activeExercise}
        onClose={() => setActiveExercise(null)}
      />
    );
  }

  const filtered = filter === 'all'
    ? EXERCISE_LIBRARY
    : EXERCISE_LIBRARY.filter(e => e.category === filter);

  return (
    <div className="card-elevated overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4"
      >
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 glow-primary">
          <Camera className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-semibold text-foreground">AI Workout</h3>
          <p className="text-[10px] text-muted-foreground">{EXERCISE_LIBRARY.length} exercises • Camera + Rep Counter + Form AI</p>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-secondary",
          expanded && "rotate-180"
        )}>
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-up">
          {/* Category filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  filter === cat
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Exercise grid */}
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(exercise => (
              <button
                key={exercise.type}
                onClick={() => setActiveExercise(exercise)}
                className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all text-left group border border-transparent hover:border-primary/20"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg">{exercise.icon}</span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize",
                    DIFFICULTY_COLORS[exercise.difficulty]
                  )}>
                    {exercise.difficulty}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{exercise.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {exercise.targetReps} reps • {Math.round(exercise.caloriesPerRep * exercise.targetReps)} cal
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-3 h-3 text-primary" />
                  <span className="text-[9px] text-primary font-medium">Start</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
