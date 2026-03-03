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
        className="w-full flex items-center gap-3 p-4"
      >
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
          allDone ? "gradient-primary" : "bg-secondary"
        )}>
          {allDone ? (
            <Check className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Dumbbell className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 text-left">
          <h3 className={cn(
            "text-sm font-semibold",
            allDone ? "text-primary" : "text-foreground"
          )}>
            Workout ({doneCount}/{tasks.length})
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
        <div className="px-4 pb-4 space-y-2">
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

          {/* Week mini calendar */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={cn("text-[10px]", d.isToday ? "text-primary font-semibold" : "text-muted-foreground")}>
                  {d.label}
                </span>
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  d.done ? "bg-primary/20" : "bg-secondary",
                  d.isToday && "ring-1 ring-primary"
                )}>
                  {d.done && <Check className="w-3 h-3 text-primary" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
