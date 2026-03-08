import { useState } from 'react';
import { Camera, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXERCISE_LIBRARY, type ExerciseConfig } from '@/lib/repCounter';
import { AIWorkoutSession } from '@/components/ai-workout/AIWorkoutSession';

type CategoryFilter = 'all' | 'upper' | 'lower' | 'full' | 'cardio';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  upper: 'Upper',
  lower: 'Lower',
  full: 'Full Body',
  cardio: 'Cardio',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-success bg-success/10 border-success/20',
  intermediate: 'text-streak bg-streak/10 border-streak/20',
  advanced: 'text-primary bg-primary/10 border-primary/20',
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
        className="w-full flex items-center gap-3 p-4 press-effect"
      >
        <div className="w-11 h-11 rounded-lg gradient-primary flex items-center justify-center shrink-0 glow-primary">
          <Camera className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-display uppercase tracking-wide text-foreground">AI Workout</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">{EXERCISE_LIBRARY.length} exercises · Camera tracking · Form AI</p>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-transform bg-secondary",
          expanded && "rotate-180"
        )}>
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-up">
          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all uppercase tracking-wider press-effect",
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
                className="flex flex-col gap-2 p-3.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-all text-left group border border-transparent hover:border-primary/15 press-effect"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg">{exercise.icon}</span>
                  <span className={cn(
                    "text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border",
                    DIFFICULTY_COLORS[exercise.difficulty]
                  )}>
                    {exercise.difficulty}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{exercise.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {exercise.targetReps} reps · {Math.round(exercise.caloriesPerRep * exercise.targetReps)} cal
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="text-[9px] text-primary font-bold uppercase tracking-wider">Start</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
