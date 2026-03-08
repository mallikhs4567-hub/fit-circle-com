import { Check, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface WorkoutTask {
  id: string;
  text: string;
  completed: boolean;
}

interface WorkoutSectionProps {
  tasks: WorkoutTask[];
  allDone: boolean;
  onToggle: (id: string) => void;
  weekDays: { label: string; done: boolean; isToday: boolean }[];
}

export function WorkoutSection({ tasks, allDone, onToggle, weekDays }: WorkoutSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const doneCount = tasks.filter(t => t.completed).length;

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
            <Dumbbell className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 text-left">
          <h3 className={cn(
            "text-sm font-display uppercase tracking-wide",
            allDone ? "text-primary" : "text-foreground"
          )}>
            Workout
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
        <div className="px-4 pb-4 space-y-2 animate-fade-up">
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

          {/* Week mini calendar */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-border">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className={cn(
                  "text-[10px] uppercase tracking-wider font-medium",
                  d.isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {d.label}
                </span>
                <div className={cn(
                  "w-6 h-6 rounded flex items-center justify-center transition-all",
                  d.done ? "gradient-primary" : "bg-secondary",
                  d.isToday && !d.done && "ring-1 ring-primary/40"
                )}>
                  {d.done && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
