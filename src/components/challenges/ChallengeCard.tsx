import { useState } from 'react';
import { Dumbbell, Users, Clock, Trophy, ChevronRight, Zap, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Challenge, type ChallengeParticipant } from '@/hooks/useChallenges';

interface ChallengeCardProps {
  challenge: Challenge;
  participation: ChallengeParticipant | null;
  onJoin: (id: string) => void;
  onViewLeaderboard: (id: string) => void;
}

const exerciseIcons: Record<string, string> = {
  pushups: '💪',
  squats: '🦵',
  situps: '🔥',
  plank: '🧘',
  lunges: '🏃',
  jumping_jacks: '⭐',
  high_knees: '🦿',
  tricep_dips: '💎',
  deadlifts: '🏋️',
};

export function ChallengeCard({ challenge, participation, onJoin, onViewLeaderboard }: ChallengeCardProps) {
  const [joining, setJoining] = useState(false);
  const isJoined = !!participation;
  const progress = participation ? participation.progress : 0;
  const progressPct = Math.min((progress / challenge.target_reps) * 100, 100);
  const isCompleted = participation?.completed ?? false;

  const handleJoin = async () => {
    setJoining(true);
    await onJoin(challenge.id);
    setJoining(false);
  };

  return (
    <div className={cn(
      "card-elevated overflow-hidden transition-all duration-200",
      isCompleted && "border-primary/20"
    )}>
      {/* Header */}
      <div className="p-4 pb-3 flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
          {challenge.is_global ? '🌍' : (exerciseIcons[challenge.exercise_type] || '💪')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-display uppercase tracking-wide text-foreground truncate">{challenge.title}</h3>
            {isCompleted && (
              <div className="w-5 h-5 rounded gradient-primary flex items-center justify-center shrink-0">
                <Trophy className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
          {challenge.is_global && (
            <div className="flex items-center gap-1 mt-0.5">
              <Globe className="w-3 h-3 text-primary" />
              <span className="text-[9px] text-primary font-bold uppercase tracking-wider">Global</span>
            </div>
          )}
          {challenge.description && (
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{challenge.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Dumbbell className="w-3 h-3" /> {challenge.target_reps}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {challenge.duration_days}d
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" /> {challenge.participant_count}
        </span>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3 pb-4 space-y-3">
        {isJoined && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground uppercase tracking-wider">Progress</span>
              <span className={cn("stat-value text-xs", isCompleted ? "text-primary" : "text-foreground")}>
                {progress}/{challenge.target_reps} ({Math.round(progressPct)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded overflow-hidden">
              <div
                className={cn(
                  "h-full rounded transition-all duration-500",
                  isCompleted ? "gradient-primary" : "bg-primary/70"
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {challenge.is_global && challenge.global_target && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground uppercase tracking-wider">Community</span>
              <span className="stat-value text-xs text-primary">
                {challenge.global_progress.toLocaleString()}/{challenge.global_target.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded overflow-hidden">
              <div
                className="h-full rounded gradient-primary transition-all duration-500"
                style={{ width: `${Math.min((challenge.global_progress / challenge.global_target) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Action */}
        {!isJoined ? (
          <button
            onClick={handleJoin}
            disabled={joining}
            className={cn(
              "w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all press-effect",
              "gradient-primary text-primary-foreground",
              joining && "opacity-50"
            )}
          >
            {joining ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Joining...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4" /> Join Challenge
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={() => onViewLeaderboard(challenge.id)}
            className="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider bg-secondary text-foreground transition-all hover:bg-muted flex items-center justify-center gap-1.5 press-effect"
          >
            <Trophy className="w-4 h-4 text-primary" />
            Leaderboard
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
