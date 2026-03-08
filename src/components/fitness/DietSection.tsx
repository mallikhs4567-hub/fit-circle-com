import { Check, Utensils, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DietTask {
  id: string;
  text: string;
  completed: boolean;
}

interface DietSectionProps {
  tasks: DietTask[];
  allDone: boolean;
  onToggle: (id: string) => void;
  goal: string | null;
}

const MACRO_TARGETS: Record<string, { protein: number; carbs: number; fats: number; calories: number }> = {
  'weight-loss': { protein: 40, carbs: 30, fats: 30, calories: 1800 },
  'muscle-gain': { protein: 35, carbs: 45, fats: 20, calories: 2500 },
  'healthy-routine': { protein: 30, carbs: 40, fats: 30, calories: 2000 },
};

export function DietSection({ tasks, allDone, onToggle, goal }: DietSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const doneCount = tasks.filter(t => t.completed).length;
  const macros = MACRO_TARGETS[goal || 'healthy-routine'] || MACRO_TARGETS['healthy-routine'];
  const caloriesConsumed = Math.round((doneCount / Math.max(tasks.length, 1)) * macros.calories);

  return (
    <div className="card-elevated overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 press-effect"
      >
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all",
          allDone ? "gradient-primary glow-primary" : "bg-secondary"
        )}>
          {allDone ? (
            <Check className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Utensils className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 text-left">
          <h3 className={cn(
            "text-sm font-display uppercase tracking-wide",
            allDone ? "text-primary" : "text-foreground"
          )}>
            Nutrition
            <span className="text-muted-foreground font-sans text-xs normal-case tracking-normal ml-2">
              {doneCount}/{tasks.length}
            </span>
          </h3>
          <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                allDone ? "gradient-primary" : "bg-primary/70"
              )}
              style={{ width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-up">
          {/* Macro bars */}
          <div className="grid grid-cols-3 gap-2">
            <MacroBar label="Protein" percent={macros.protein} variant="primary" />
            <MacroBar label="Carbs" percent={macros.carbs} variant="accent" />
            <MacroBar label="Fats" percent={macros.fats} variant="muted" />
          </div>

          {/* Calorie indicator */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-muted-foreground">
              <span className="stat-value text-sm text-foreground">{caloriesConsumed}</span> / {macros.calories} kcal
            </span>
            <span className={cn(
              "font-semibold",
              allDone ? "text-primary" : "text-foreground"
            )}>
              {macros.calories - caloriesConsumed} left
            </span>
          </div>

          {/* Meal tasks */}
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => onToggle(task.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left press-effect",
                task.completed
                  ? "bg-primary/8 border border-primary/15"
                  : "bg-secondary/60 hover:bg-secondary border border-transparent"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all",
                task.completed ? "bg-primary border-primary" : "border-muted-foreground/30"
              )}>
                {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span className={cn(
                "text-sm",
                task.completed ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {task.text}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MacroBar({ label, percent, variant }: { label: string; percent: number; variant: 'primary' | 'accent' | 'muted' }) {
  const barColor = {
    primary: 'bg-primary',
    accent: 'bg-streak',
    muted: 'bg-muted-foreground/50',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-[10px] stat-value text-foreground">{percent}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor[variant])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
