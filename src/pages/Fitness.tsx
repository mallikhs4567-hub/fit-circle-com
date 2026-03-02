import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useChecklist } from '@/hooks/useChecklist';
import { useXP } from '@/hooks/useXP';
import { LevelUpModal } from '@/components/common/LevelUpModal';
import { StreakBadge } from '@/components/common/StreakBadge';
import { Check, Dumbbell, Utensils, Trophy, Flame, ChevronRight, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type FitnessGoal = 'weight-loss' | 'muscle-gain' | 'healthy-routine';

interface WorkoutTask {
  id: string;
  text: string;
  completed: boolean;
}

interface FitnessPlan {
  goal: FitnessGoal;
  workout: string[];
  diet: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
}

const fitnessPlans: Record<FitnessGoal, FitnessPlan> = {
  'weight-loss': {
    goal: 'weight-loss',
    workout: [
      '15 min HIIT cardio',
      '20 bodyweight squats',
      '30 sec plank hold',
      '15 lunges each leg',
      '20 jumping jacks',
    ],
    diet: {
      breakfast: 'Oats with banana & almonds, green tea',
      lunch: 'Brown rice, dal, sabzi, salad',
      dinner: 'Grilled paneer/chicken, roti, raita',
      snacks: 'Fruits, sprouts, or buttermilk',
    },
  },
  'muscle-gain': {
    goal: 'muscle-gain',
    workout: [
      '15 push-ups (3 sets)',
      '20 squats with hold',
      'Diamond push-ups x 10',
      'Bulgarian split squats',
      '30 sec wall sit',
    ],
    diet: {
      breakfast: 'Eggs, whole wheat toast, banana shake',
      lunch: 'Chicken/paneer curry, rice, dal',
      dinner: 'Roti, rajma/chole, curd',
      snacks: 'Peanut butter toast, almonds, whey protein',
    },
  },
  'healthy-routine': {
    goal: 'healthy-routine',
    workout: [
      '10 min morning stretches',
      '15 min brisk walk',
      '5 min deep breathing',
      '10 squats, 10 push-ups',
      '5 min evening meditation',
    ],
    diet: {
      breakfast: 'Idli/poha with chutney, fruit',
      lunch: 'Balanced thali with veggies',
      dinner: 'Light khichdi or soup with roti',
      snacks: 'Nuts, fruits, herbal tea',
    },
  },
};

export default function Fitness() {
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { checklist, loading: checklistLoading, updateChecklist } = useChecklist();
  const { awardXP } = useXP();
  const [showPlan, setShowPlan] = useState<'workout' | 'diet' | null>(null);
  const [workoutTasks, setWorkoutTasks] = useState<WorkoutTask[]>([]);
  const [dietTasks, setDietTasks] = useState<WorkoutTask[]>([]);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

  const plan = profile?.goal ? fitnessPlans[profile.goal as FitnessGoal] : null;
  
  // Initialize tasks when plan is available
  useEffect(() => {
    if (plan && workoutTasks.length === 0) {
      setWorkoutTasks(plan.workout.map((text, idx) => ({
        id: `workout-${idx}`,
        text,
        completed: checklist?.workout_completed || false,
      })));
      
      const dietItems = [
        `Breakfast: ${plan.diet.breakfast}`,
        `Lunch: ${plan.diet.lunch}`,
        `Dinner: ${plan.diet.dinner}`,
        `Snacks: ${plan.diet.snacks}`,
      ];
      setDietTasks(dietItems.map((text, idx) => ({
        id: `diet-${idx}`,
        text,
        completed: checklist?.diet_followed || false,
      })));
    }
  }, [plan, checklist]);

  const allWorkoutDone = workoutTasks.length > 0 && workoutTasks.every(t => t.completed);
  const allDietDone = dietTasks.length > 0 && dietTasks.every(t => t.completed);
  const bothCompleted = allWorkoutDone && allDietDone;

  const toggleWorkoutTask = async (taskId: string) => {
    const updated = workoutTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setWorkoutTasks(updated);
    
    const nowAllDone = updated.every(t => t.completed);
    if (nowAllDone && !checklist?.workout_completed) {
      await updateChecklist('workout');
      const result = await awardXP('workout_completed');
      if (result?.leveledUp) setLevelUpLevel(result.newLevel);
      if (allDietDone) {
        refetchProfile();
      }
    }
  };

  const toggleDietTask = async (taskId: string) => {
    const updated = dietTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setDietTasks(updated);
    
    const nowAllDone = updated.every(t => t.completed);
    if (nowAllDone && !checklist?.diet_followed) {
      await updateChecklist('diet');
      const result = await awardXP('diet_completed');
      if (result?.leveledUp) setLevelUpLevel(result.newLevel);
      if (allWorkoutDone) {
        refetchProfile();
      }
    }
  };

  if (profileLoading || checklistLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">Please complete onboarding first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="safe-top px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-muted-foreground text-sm">Today's Progress</p>
            <h1 className="text-2xl font-display font-bold text-foreground">Fitness</h1>
          </div>
          <StreakBadge streak={profile?.streak || 0} size="lg" animate={bothCompleted} />
        </div>

        {/* Streak Card */}
        {bothCompleted && (
          <div className="card-elevated p-4 gradient-accent mb-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-background/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="font-semibold text-accent-foreground">Day Complete! 🎉</p>
                <p className="text-sm text-accent-foreground/80">
                  You're on a {profile?.streak || 1} day streak
                </p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Daily Challenges */}
      <div className="px-4 space-y-3 mb-6">
        <h2 className="text-lg font-semibold text-foreground">Today's Challenges</h2>
        
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              allWorkoutDone ? "gradient-primary" : "bg-secondary"
            )}>
              {allWorkoutDone ? (
                <Check className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Dumbbell className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold",
                allWorkoutDone ? "text-primary line-through" : "text-foreground"
              )}>
                Workout ({workoutTasks.filter(t => t.completed).length}/{workoutTasks.length})
              </h3>
              <p className="text-sm text-muted-foreground">Tap tasks to mark complete</p>
            </div>
            <button onClick={() => setShowPlan('workout')} className="p-2 text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {workoutTasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={() => toggleWorkoutTask(task.id)} />
            ))}
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              allDietDone ? "gradient-primary" : "bg-secondary"
            )}>
              {allDietDone ? (
                <Check className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Utensils className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold",
                allDietDone ? "text-primary line-through" : "text-foreground"
              )}>
                Diet Plan ({dietTasks.filter(t => t.completed).length}/{dietTasks.length})
              </h3>
              <p className="text-sm text-muted-foreground">Follow your meal plan</p>
            </div>
            <button onClick={() => setShowPlan('diet')} className="p-2 text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {dietTasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={() => toggleDietTask(task.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Flame className="w-5 h-5" />
              <span className="text-sm font-medium">Current Streak</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              {profile?.streak || 0} days
            </p>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-success mb-1">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Total Active</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              {profile?.total_active_days || 0} days
            </p>
          </div>
        </div>
      </div>

      {/* Plan Details Modal */}
      {showPlan && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl animate-slide-in-bottom">
          <div className="flex flex-col h-full safe-top safe-bottom">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button
                onClick={() => setShowPlan(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <h2 className="font-semibold text-foreground capitalize">
                {showPlan === 'workout' ? 'Today\'s Workout' : 'Today\'s Diet'}
              </h2>
              <div className="w-10" />
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {showPlan === 'workout' ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm mb-4">
                    Complete these exercises for a 15-20 minute home workout
                  </p>
                  {plan.workout.map((exercise, index) => (
                    <div
                      key={index}
                      className="card-elevated p-4 animate-fade-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <p className="text-foreground">{exercise}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm mb-4">
                    Follow this Indian diet plan for {profile?.goal?.replace('-', ' ')}
                  </p>
                  
                  <MealCard title="Breakfast" content={plan.diet.breakfast} delay={0} />
                  <MealCard title="Lunch" content={plan.diet.lunch} delay={50} />
                  <MealCard title="Dinner" content={plan.diet.dinner} delay={100} />
                  <MealCard title="Snacks" content={plan.diet.snacks} delay={150} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskItem({ task, onToggle }: { task: WorkoutTask; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
        task.completed 
          ? "bg-primary/10 border border-primary/30" 
          : "bg-secondary/50 hover:bg-secondary"
      )}
    >
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center transition-all border-2",
        task.completed 
          ? "bg-primary border-primary" 
          : "border-muted-foreground/30"
      )}>
        {task.completed && <Check className="w-4 h-4 text-primary-foreground" />}
      </div>
      <span className={cn(
        "flex-1 text-left text-sm transition-all",
        task.completed ? "text-muted-foreground line-through" : "text-foreground"
      )}>
        {task.text}
      </span>
    </button>
  );
}

function MealCard({ title, content, delay }: { title: string; content: string; delay: number }) {
  return (
    <div
      className="card-elevated p-4 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="font-semibold text-primary text-sm mb-1">{title}</h3>
      <p className="text-foreground">{content}</p>
    </div>
  );
}
