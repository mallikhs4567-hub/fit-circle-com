import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsightsProps {
  streak: number;
  workoutDone: boolean;
  dietDone: boolean;
  water: number;
  sleep: number;
  steps: number;
}

export function AIInsights({ streak, workoutDone, dietDone, water, sleep, steps }: AIInsightsProps) {
  const insights: string[] = [];

  if (!workoutDone && new Date().getHours() > 18) {
    insights.push("You haven't completed today's workout yet. Try a quick 10-min session!");
  }
  if (!dietDone && new Date().getHours() > 14) {
    insights.push("Stick to your meal plan — you're halfway through the day.");
  }
  if (water < 4 && new Date().getHours() > 12) {
    insights.push("Your water intake is low. Hydrate to stay energized! 💧");
  }
  if (sleep > 0 && sleep < 6) {
    insights.push("You slept less than 6 hours. Recovery matters for progress.");
  }
  if (steps < 3000 && new Date().getHours() > 16) {
    insights.push("Steps are low today. A short walk can boost your mood.");
  }
  if (streak >= 7) {
    insights.push(`Amazing ${streak}-day streak! 🔥 Consistency is your superpower.`);
  }
  if (streak === 0) {
    insights.push("Start fresh today! Complete both workout and diet to begin a streak.");
  }

  const display = insights.slice(0, 3);
  if (display.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Smart Insights</h2>
      </div>
      {display.map((text, i) => (
        <div
          key={i}
          className="card-elevated p-3 border-l-2 border-primary/40 animate-fade-up"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
        </div>
      ))}
    </div>
  );
}
