import { useState } from 'react';
import { Camera, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXERCISE_LIBRARY, type ExerciseConfig } from '@/lib/repCounter';
import { AIWorkoutSession } from '@/components/ai-workout/AIWorkoutSession';

export function AIWorkoutLauncher() {
  const [expanded, setExpanded] = useState(false);
  const [activeExercise, setActiveExercise] = useState<ExerciseConfig | null>(null);

  if (activeExercise) {
    return (
      <AIWorkoutSession
        exercise={activeExercise}
        onClose={() => setActiveExercise(null)}
      />
    );
  }

  return (
    <div className="card-elevated overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4"
      >
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0 glow-primary">
          <Camera className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-semibold text-foreground">AI Workout</h3>
          <p className="text-[10px] text-muted-foreground">Camera + Rep Counter + Form Analysis</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 animate-fade-up">
          {EXERCISE_LIBRARY.map(exercise => (
            <button
              key={exercise.type}
              onClick={() => setActiveExercise(exercise)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{exercise.name}</p>
                <p className="text-[10px] text-muted-foreground">{exercise.targetReps} reps • {exercise.caloriesPerRep * exercise.targetReps} cal</p>
              </div>
              <Camera className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
