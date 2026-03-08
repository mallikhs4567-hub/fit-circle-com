import { useActivities } from '@/hooks/useActivities';
import { Avatar } from '@/components/common/Avatar';
import { Dumbbell, Trophy, Target, Flame, Loader2, Activity } from 'lucide-react';
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

export function ActivityFeed() {
  const { activities, loading } = useActivities(15);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="card-elevated p-6 text-center">
        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No activity yet. Complete a workout to get started!</p>
      </div>
    );
  }

  return (
    <div className="card-elevated divide-y divide-border overflow-hidden">
      {activities.map((activity, i) => {
        const config = typeConfig[activity.type] || typeConfig.workout_completed;
        const Icon = config.icon;

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 px-4 py-3 animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Avatar
              name={activity.username}
              src={activity.avatar_url ?? undefined}
              size="sm"
            />
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
  );
}
