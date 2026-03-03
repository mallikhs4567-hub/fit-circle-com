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
        className="w-full flex items-center gap-3 p-4"
      >
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
          allDone ? "gradient-primary" : "bg-secondary"
        )}>
          {allDone ? (
            <Check className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Utensils className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 text-left">
          <h3 className={cn(
            "text-sm font-semibold",
            allDone ? "text-primary" : "text-foreground"
          )}>
            Diet Plan ({doneCount}/{tasks.length})
          </h3>
          <div className="w-full bg-secondary rounded-full h-1 mt-1.5">
            <div
              className="h-1 rounded-full bg-primary transition-all duration-300"
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
        <div className="px-4 pb-4 space-y-3">
          {/* Macro bars */}
          <div className="grid grid-cols-3 gap-2">
            <MacroBar label="Protein" percent={macros.protein} color="primary" />
            <MacroBar label="Carbs" percent={macros.carbs} color="accent" />
            <MacroBar label="Fats" percent={macros.fats} color="muted-foreground" />
          </div>

          {/* Calorie indicator */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {caloriesConsumed} / {macros.calories} kcal
            </span>
            <span className={cn(
              "font-medium",
              allDone ? "text-primary" : "text-foreground"
            )}>
              {macros.calories - caloriesConsumed} remaining
            </span>
          </div>

          {/* Meal tasks */}
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => onToggle(task.id)}
              className={cn(
                "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left",
                task.completed
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-secondary/50 hover:bg-secondary"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-all",
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

function MacroBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-medium text-foreground">{percent}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", {
            'bg-primary': color === 'primary',
            'bg-accent': color === 'accent',
            'bg-muted-foreground': color === 'muted-foreground',
          })}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
