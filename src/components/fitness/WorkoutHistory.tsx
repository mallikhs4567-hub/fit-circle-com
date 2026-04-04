import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Dumbbell, Clock, Flame, Star, Zap, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

interface WorkoutResult {
  id: string;
  exercise_name: string;
  reps_completed: number;
  avg_form_score: number;
  duration_seconds: number;
  xp_earned: number;
  calories_burned: number;
  created_at: string;
}

interface WeekDay {
  label: string;
  calories: number;
  reps: number;
  workouts: number;
}

const chartConfig = {
  calories: { label: 'Calories', color: 'hsl(var(--destructive))' },
  reps: { label: 'Reps', color: 'hsl(var(--primary))' },
};

export function WorkoutHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<WorkoutResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'calories' | 'reps'>('calories');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('workout_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setHistory((data as WorkoutResult[]) || []);
      setLoading(false);
    })();
  }, [user]);

  // Weekly stats
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekData: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const src = history.length > 0 ? history : [];
    const dayWorkouts = src.filter(w => w.created_at.startsWith(dayStr));
    // Add some demo sparkle for empty days
    const demoCalories = history.length === 0 ? [0, 85, 120, 0, 95, 145, 0][i] : 0;
    const demoReps = history.length === 0 ? [0, 30, 45, 0, 35, 60, 0][i] : 0;
    return {
      label: format(day, 'EEE'),
      calories: dayWorkouts.reduce((s, w) => s + w.calories_burned, 0) + demoCalories,
      reps: dayWorkouts.reduce((s, w) => s + w.reps_completed, 0) + demoReps,
      workouts: dayWorkouts.length + (demoCalories > 0 ? 1 : 0),
    };
  });

  const thisWeekWorkouts = history.filter(w => {
    const d = new Date(w.created_at);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  });
  const totalCalories = thisWeekWorkouts.reduce((s, w) => s + w.calories_burned, 0);
  const totalReps = thisWeekWorkouts.reduce((s, w) => s + w.reps_completed, 0);
  const totalDuration = thisWeekWorkouts.reduce((s, w) => s + w.duration_seconds, 0);
  const avgForm = thisWeekWorkouts.length > 0
    ? Math.round(thisWeekWorkouts.reduce((s, w) => s + w.avg_form_score, 0) / thisWeekWorkouts.length)
    : 0;

  if (loading) {
    return (
      <div className="card-elevated p-6 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Demo workout data for new users
  const demoWorkouts: WorkoutResult[] = [
    { id: 'dw-1', exercise_name: 'Push-ups', reps_completed: 30, avg_form_score: 94, duration_seconds: 180, xp_earned: 35, calories_burned: 28, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'dw-2', exercise_name: 'Squats', reps_completed: 45, avg_form_score: 88, duration_seconds: 240, xp_earned: 42, calories_burned: 52, created_at: new Date(Date.now() - 26 * 3600000).toISOString() },
    { id: 'dw-3', exercise_name: 'Lunges', reps_completed: 20, avg_form_score: 91, duration_seconds: 150, xp_earned: 28, calories_burned: 34, created_at: new Date(Date.now() - 50 * 3600000).toISOString() },
    { id: 'dw-4', exercise_name: 'Sit-ups', reps_completed: 50, avg_form_score: 86, duration_seconds: 200, xp_earned: 38, calories_burned: 40, created_at: new Date(Date.now() - 74 * 3600000).toISOString() },
    { id: 'dw-5', exercise_name: 'Jumping Jacks', reps_completed: 60, avg_form_score: 92, duration_seconds: 120, xp_earned: 30, calories_burned: 65, created_at: new Date(Date.now() - 98 * 3600000).toISOString() },
  ];

  const displayHistory = history.length > 0 ? history : demoWorkouts;
  const isDemo = history.length === 0;

  return (
    <div className="space-y-4">
      {/* Weekly Summary */}
      <div className="card-elevated p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-display uppercase tracking-wide text-foreground">This Week</h3>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{thisWeekWorkouts.length} sessions</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-secondary rounded-lg p-2.5 text-center">
            <Flame className="w-3.5 h-3.5 text-primary mx-auto mb-1.5" />
            <p className="stat-value text-base text-foreground">{totalCalories}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Cal</p>
          </div>
          <div className="bg-secondary rounded-lg p-2.5 text-center">
            <Dumbbell className="w-3.5 h-3.5 text-primary mx-auto mb-1.5" />
            <p className="stat-value text-base text-foreground">{totalReps}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Reps</p>
          </div>
          <div className="bg-secondary rounded-lg p-2.5 text-center">
            <Clock className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1.5" />
            <p className="stat-value text-base text-foreground">{Math.round(totalDuration / 60)}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Min</p>
          </div>
          <div className="bg-secondary rounded-lg p-2.5 text-center">
            <Star className="w-3.5 h-3.5 text-streak mx-auto mb-1.5" />
            <p className="stat-value text-base text-foreground">{avgForm}%</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Form</p>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-2">
          <div className="flex gap-1">
            {(['calories', 'reps'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setChartMode(mode)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded font-bold transition-all uppercase tracking-wider press-effect",
                  chartMode === mode
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {mode === 'calories' ? 'Calories' : 'Reps'}
              </button>
            ))}
          </div>

          <ChartContainer config={chartConfig} className="h-32 w-full">
            <BarChart data={weekData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey={chartMode}
                fill={chartMode === 'calories' ? 'hsl(var(--primary))' : 'hsl(var(--primary))'}
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* History Cards */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-display uppercase tracking-wide text-foreground">Sessions</h3>
        </div>

        <ScrollArea className="h-[280px]">
          <div className="space-y-2 pr-3">
            {displayHistory.map((workout, idx) => {
              const mins = Math.floor(workout.duration_seconds / 60);
              const secs = workout.duration_seconds % 60;
              const formColor = workout.avg_form_score >= 90
                ? 'text-primary'
                : workout.avg_form_score >= 75
                  ? 'text-streak'
                  : 'text-destructive';

              return (
                <div key={workout.id} className="card-elevated p-3 space-y-2 animate-stagger-in" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                        <Dumbbell className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{workout.exercise_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(workout.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="stat-value text-xs text-primary">+{workout.xp_earned}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" /> {workout.reps_completed}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {mins}:{secs.toString().padStart(2, '0')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-primary" /> {workout.calories_burned}
                    </span>
                    <span className={cn("flex items-center gap-1 ml-auto font-bold", formColor)}>
                      <Star className="w-3 h-3" /> {workout.avg_form_score}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar />
        </ScrollArea>
      </div>
    </div>
  );
}
