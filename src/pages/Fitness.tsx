import { useState, useEffect, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useChecklist } from '@/hooks/useChecklist';
import { useXP } from '@/hooks/useXP';
import { useFitnessTrackers } from '@/hooks/useFitnessTrackers';
import { LevelUpModal } from '@/components/common/LevelUpModal';
import { FitnessHeader } from '@/components/fitness/FitnessHeader';
import { WorkoutSection } from '@/components/fitness/WorkoutSection';
import { DietSection } from '@/components/fitness/DietSection';
import { TrackersSection } from '@/components/fitness/TrackersSection';
import { ProgressAnalytics } from '@/components/fitness/ProgressAnalytics';
import { AIInsights } from '@/components/fitness/AIInsights';
import { AIWorkoutLauncher } from '@/components/fitness/AIWorkoutLauncher';
import { BodyProgress } from '@/components/fitness/BodyProgress';
import { EnhancedLeaderboard } from '@/components/fitness/EnhancedLeaderboard';
import { WorkoutHistory } from '@/components/fitness/WorkoutHistory';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type FitnessGoal = 'weight-loss' | 'muscle-gain' | 'healthy-routine';

interface WorkoutTask {
  id: string;
  text: string;
  completed: boolean;
}

const fitnessPlans: Record<FitnessGoal, { workout: string[]; diet: { breakfast: string; lunch: string; dinner: string; snacks: string } }> = {
  'weight-loss': {
    workout: ['15 min HIIT cardio', '20 bodyweight squats', '30 sec plank hold', '15 lunges each leg', '20 jumping jacks'],
    diet: { breakfast: 'Oats with banana & almonds, green tea', lunch: 'Brown rice, dal, sabzi, salad', dinner: 'Grilled paneer/chicken, roti, raita', snacks: 'Fruits, sprouts, or buttermilk' },
  },
  'muscle-gain': {
    workout: ['15 push-ups (3 sets)', '20 squats with hold', 'Diamond push-ups x 10', 'Bulgarian split squats', '30 sec wall sit'],
    diet: { breakfast: 'Eggs, whole wheat toast, banana shake', lunch: 'Chicken/paneer curry, rice, dal', dinner: 'Roti, rajma/chole, curd', snacks: 'Peanut butter toast, almonds, whey protein' },
  },
  'healthy-routine': {
    workout: ['10 min morning stretches', '15 min brisk walk', '5 min deep breathing', '10 squats, 10 push-ups', '5 min evening meditation'],
    diet: { breakfast: 'Idli/poha with chutney, fruit', lunch: 'Balanced thali with veggies', dinner: 'Light khichdi or soup with roti', snacks: 'Nuts, fruits, herbal tea' },
  },
};

export default function Fitness() {
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { checklist, loading: checklistLoading, updateChecklist } = useChecklist();
  const { awardXP, fetchWeeklyLeaderboard } = useXP();
  const { trackers, addWater, removeWater, setSteps, setSleep, logWeight, getWeekData } = useFitnessTrackers(profile?.weight ?? null);

  const [workoutTasks, setWorkoutTasks] = useState<WorkoutTask[]>([]);
  const [dietTasks, setDietTasks] = useState<WorkoutTask[]>([]);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ username: string; xp: number }[]>([]);

  const plan = profile?.goal ? fitnessPlans[profile.goal as FitnessGoal] : null;

  // Init tasks
  useEffect(() => {
    if (plan && workoutTasks.length === 0) {
      setWorkoutTasks(plan.workout.map((text, idx) => ({
        id: `workout-${idx}`, text, completed: checklist?.workout_completed || false,
      })));
      const dietItems = [
        `Breakfast: ${plan.diet.breakfast}`,
        `Lunch: ${plan.diet.lunch}`,
        `Dinner: ${plan.diet.dinner}`,
        `Snacks: ${plan.diet.snacks}`,
      ];
      setDietTasks(dietItems.map((text, idx) => ({
        id: `diet-${idx}`, text, completed: checklist?.diet_followed || false,
      })));
    }
  }, [plan, checklist]);

  // Fetch leaderboard
  useEffect(() => {
    (async () => {
      const data = await fetchWeeklyLeaderboard();
      if (data.length > 0) {
        const userIds = data.map(d => d.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p.username]));
        setLeaderboard(data.map(d => ({
          username: profileMap.get(d.user_id) || 'User',
          xp: d.xp,
        })));
      }
    })();
  }, [fetchWeeklyLeaderboard]);

  const allWorkoutDone = workoutTasks.length > 0 && workoutTasks.every(t => t.completed);
  const allDietDone = dietTasks.length > 0 && dietTasks.every(t => t.completed);

  const toggleWorkoutTask = async (taskId: string) => {
    const updated = workoutTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setWorkoutTasks(updated);
    const nowAllDone = updated.every(t => t.completed);
    if (nowAllDone && !checklist?.workout_completed) {
      await updateChecklist('workout');
      const result = await awardXP('workout_completed');
      if (result?.leveledUp) setLevelUpLevel(result.newLevel);
      if (allDietDone) refetchProfile();
    }
  };

  const toggleDietTask = async (taskId: string) => {
    const updated = dietTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setDietTasks(updated);
    const nowAllDone = updated.every(t => t.completed);
    if (nowAllDone && !checklist?.diet_followed) {
      await updateChecklist('diet');
      const result = await awardXP('diet_completed');
      if (result?.leveledUp) setLevelUpLevel(result.newLevel);
      if (allWorkoutDone) refetchProfile();
    }
  };

  // Week mini calendar
  const weekDays = useMemo(() => {
    const days: { label: string; done: boolean; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
      d.setDate(d.getDate() + diff + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2),
        done: dateStr === todayStr ? allWorkoutDone : false,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [allWorkoutDone]);

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
    <div className="min-h-screen bg-background pb-24">
      <LevelUpModal
        open={levelUpLevel !== null}
        level={levelUpLevel ?? 1}
        onClose={() => setLevelUpLevel(null)}
      />

      <FitnessHeader
        username={profile?.username || 'User'}
        streak={profile?.streak || 0}
        xp={profile?.xp || 0}
        workoutDone={allWorkoutDone}
        dietDone={allDietDone}
      />

      <div className="px-4 space-y-5">
        {/* AI Workout — top priority */}
        <AIWorkoutLauncher />

        {/* Core daily tasks */}
        <div className="grid grid-cols-1 gap-4">
          <WorkoutSection
            tasks={workoutTasks}
            allDone={allWorkoutDone}
            onToggle={toggleWorkoutTask}
            weekDays={weekDays}
          />

          <DietSection
            tasks={dietTasks}
            allDone={allDietDone}
            onToggle={toggleDietTask}
            goal={profile?.goal || null}
          />
        </div>

        {/* Health trackers */}
        <TrackersSection
          water={trackers.water}
          steps={trackers.steps}
          sleep={trackers.sleep}
          weightLog={trackers.weightLog}
          onAddWater={addWater}
          onRemoveWater={removeWater}
          onSetSteps={setSteps}
          onSetSleep={setSleep}
          onLogWeight={logWeight}
        />

        {/* Progress & Analytics section */}
        <div className="space-y-4">
          <h2 className="text-sm font-display font-bold text-foreground px-1">Progress & Analytics</h2>
          
          <BodyProgress />

          <ProgressAnalytics
            streak={profile?.streak || 0}
            totalActiveDays={profile?.total_active_days || 0}
            weekData={getWeekData()}
            leaderboard={leaderboard}
          />

          <EnhancedLeaderboard />
        </div>

        <AIInsights
          streak={profile?.streak || 0}
          workoutDone={allWorkoutDone}
          dietDone={allDietDone}
          water={trackers.water}
          sleep={trackers.sleep}
          steps={trackers.steps}
        />
      </div>
    </div>
  );
}
