import { useState, useEffect } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { Avatar } from '@/components/common/Avatar';
import { Dumbbell, Trophy, Target, Flame, Loader2, Activity, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeConfig: Record<string, { icon: typeof Dumbbell; color: string }> = {
  workout_completed: { icon: Dumbbell, color: 'text-primary' },
  challenge_joined: { icon: Target, color: 'text-accent' },
  challenge_completed: { icon: Trophy, color: 'text-primary' },
  streak_achieved: { icon: Flame, color: 'text-streak' },
};

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

const minsAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

const demoActivities = [
  { id: 'da-1', user_id: 'demo-1', type: 'workout_completed', description: 'fitness_priya completed 30 pushups with 94% form 💪', created_at: minsAgo(3), username: 'fitness_priya', avatar_url: null },
  { id: 'da-2', user_id: 'demo-2', type: 'streak_achieved', description: 'muscle_rahul hit a 14-day streak! 🔥', created_at: minsAgo(8), username: 'muscle_rahul', avatar_url: null },
  { id: 'da-3', user_id: 'demo-3', type: 'challenge_joined', description: 'runner_vikram joined the 100 Pushup Challenge', created_at: minsAgo(15), username: 'runner_vikram', avatar_url: null },
  { id: 'da-4', user_id: 'demo-4', type: 'workout_completed', description: 'yoga_anita completed 45 squats with 88% form', created_at: minsAgo(22), username: 'yoga_anita', avatar_url: null },
  { id: 'da-5', user_id: 'demo-5', type: 'challenge_completed', description: 'iron_arjun completed the Jumping Jacks Frenzy! 🏆', created_at: minsAgo(35), username: 'iron_arjun', avatar_url: null },
  { id: 'da-6', user_id: 'demo-6', type: 'workout_completed', description: 'power_neha smashed 25 lunges with 91% form', created_at: minsAgo(42), username: 'power_neha', avatar_url: null },
  { id: 'da-7', user_id: 'demo-1', type: 'streak_achieved', description: 'fitness_priya hit a 21-day streak! 🔥🔥', created_at: minsAgo(55), username: 'fitness_priya', avatar_url: null },
  { id: 'da-8', user_id: 'demo-7', type: 'challenge_joined', description: 'cardio_queen_riya joined Global Plank Party 🌍', created_at: minsAgo(68), username: 'cardio_queen_riya', avatar_url: null },
  { id: 'da-9', user_id: 'demo-8', type: 'workout_completed', description: 'core_king_sid completed 50 situps with 96% form 🎯', created_at: minsAgo(80), username: 'core_king_sid', avatar_url: null },
  { id: 'da-10', user_id: 'demo-9', type: 'workout_completed', description: 'zen_maya finished a 5-minute plank hold!', created_at: minsAgo(95), username: 'zen_maya', avatar_url: null },
];

export function ActivityFeed() {
  const { activities, loading } = useActivities(15);
  const [activeCount, setActiveCount] = useState(342);

  // Simulate live active users counter
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayActivities = activities.length > 0 ? activities : demoActivities;

  return (
    <div className="space-y-2">
      {/* Live indicator */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-online-pulse" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live Feed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-success font-bold">{activeCount} active now</span>
        </div>
      </div>

      <div className="card-elevated divide-y divide-border overflow-hidden">
        {displayActivities.map((activity, i) => {
          const config = typeConfig[activity.type] || typeConfig.workout_completed;
          const Icon = config.icon;

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 px-4 py-3 animate-stagger-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative">
                <Avatar
                  name={activity.username}
                  src={activity.avatar_url ?? undefined}
                  size="sm"
                />
                {i < 3 && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-card animate-online-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground leading-snug">
                  {activity.description}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {getTimeAgo(activity.created_at)}
                </p>
              </div>
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center bg-secondary shrink-0",
                config.color
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
