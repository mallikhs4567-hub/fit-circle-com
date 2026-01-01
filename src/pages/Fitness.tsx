import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useChecklist } from '@/hooks/useChecklist';
import { StreakBadge } from '@/components/common/StreakBadge';
import { Check, Dumbbell, Utensils, Trophy, Flame, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type FitnessGoal = 'weight-loss' | 'muscle-gain' | 'healthy-routine';

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
      '🏃 15 min HIIT cardio',
      '💪 20 bodyweight squats',
      '🔥 30 sec plank hold',
      '🦵 15 lunges each leg',
      '⚡ 20 jumping jacks',
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
      '💪 15 push-ups (3 sets)',
      '🏋️ 20 squats with hold',
      '🔥 Diamond push-ups x 10',
      '🦵 Bulgarian split squats',
      '⚡ 30 sec wall sit',
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
      '🧘 10 min morning stretches',
      '🚶 15 min brisk walk',
      '🧘‍♀️ 5 min deep breathing',
      '💪 10 squats, 10 push-ups',
      '🌅 5 min evening meditation',
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
  const { profile, loading: profileLoading } = useProfile();
  const { checklist, loading: checklistLoading, updateChecklist } = useChecklist();
  const [showPlan, setShowPlan] = useState<'workout' | 'diet' | null>(null);

  const plan = profile?.goal ? fitnessPlans[profile.goal as FitnessGoal] : null;
  const bothCompleted = checklist?.workout_completed && checklist?.diet_followed;

  const handleChecklistToggle = async (type: 'workout' | 'diet') => {
    await updateChecklist(type);
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

      {/* Daily Checklist */}
      <div className="px-4 space-y-3 mb-6">
        <h2 className="text-lg font-semibold text-foreground">Daily Checklist</h2>
        
        <ChecklistItem
          icon={Dumbbell}
          title="Workout Completed"
          description="Complete today's workout"
          checked={checklist?.workout_completed || false}
          onToggle={() => handleChecklistToggle('workout')}
          onViewDetails={() => setShowPlan('workout')}
        />

        <ChecklistItem
          icon={Utensils}
          title="Diet Followed"
          description="Follow today's meal plan"
          checked={checklist?.diet_followed || false}
          onToggle={() => handleChecklistToggle('diet')}
          onViewDetails={() => setShowPlan('diet')}
        />
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

function ChecklistItem({
  icon: Icon,
  title,
  description,
  checked,
  onToggle,
  onViewDetails,
}: {
  icon: typeof Dumbbell;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
}) {
  return (
    <div className={cn(
      "card-elevated p-4 transition-all duration-300",
      checked && "border-primary/50 bg-primary/5"
    )}>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
            checked
              ? "gradient-primary"
              : "bg-secondary hover:bg-secondary/80"
          )}
        >
          {checked ? (
            <Check className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Icon className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        
        <div className="flex-1" onClick={onViewDetails}>
          <h3 className={cn(
            "font-semibold transition-colors",
            checked ? "text-primary" : "text-foreground"
          )}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <button
          onClick={onViewDetails}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
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
