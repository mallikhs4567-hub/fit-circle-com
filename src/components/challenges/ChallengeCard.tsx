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

const exerciseGradients: Record<string, string> = {
  pushups: 'from-primary/20 to-primary/5',
  squats: 'from-accent/20 to-accent/5',
  situps: 'from-destructive/20 to-destructive/5',
  plank: 'from-[hsl(var(--success))]/20 to-[hsl(var(--success))]/5',
  default: 'from-primary/20 to-primary/5',
};

export function ChallengeCard({ challenge, participation, onJoin, onViewLeaderboard }: ChallengeCardProps) {
  const [joining, setJoining] = useState(false);
  const isJoined = !!participation;
  const progress = participation ? participation.progress : 0;
  const progressPct = Math.min((progress / challenge.target_reps) * 100, 100);
  const isCompleted = participation?.completed ?? false;
  const gradient = exerciseGradients[challenge.exercise_type] || exerciseGradients.default;

  const handleJoin = async () => {
    setJoining(true);
    await onJoin(challenge.id);
    setJoining(false);
  };

  return (
    <div className={cn(
      "card-elevated overflow-hidden transition-all duration-300 animate-fade-in",
      isCompleted && "ring-1 ring-primary/30"
    )}>
      {/* Gradient header */}
      <div className={cn("bg-gradient-to-r p-4", gradient)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-card/80 backdrop-blur-sm flex items-center justify-center text-xl shadow-lg">
              {challenge.is_global ? '🌍' : (exerciseIcons[challenge.exercise_type] || '💪')}
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-foreground leading-tight">{challenge.title}</h3>
              {challenge.is_global && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Globe className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary font-medium">Global Challenge</span>
                </div>
              )}
            </div>
          </div>
          {isCompleted && (
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-lg">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {challenge.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{challenge.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Dumbbell className="w-3.5 h-3.5" /> {challenge.target_reps} {challenge.exercise_type}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {challenge.duration_days}d
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {challenge.participant_count}
          </span>
        </div>

        {/* Progress bar */}
        {isJoined && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Progress</span>
              <span className={cn("font-semibold", isCompleted ? "text-primary" : "text-foreground")}>
                {progress}/{challenge.target_reps} ({Math.round(progressPct)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isCompleted ? "gradient-primary" : "bg-primary/70"
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Global progress */}
        {challenge.is_global && challenge.global_target && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Community Progress</span>
              <span className="text-primary font-semibold">
                {challenge.global_progress.toLocaleString()}/{challenge.global_target.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${Math.min((challenge.global_progress / challenge.global_target) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!isJoined ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                "gradient-primary text-primary-foreground hover-scale",
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
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-foreground transition-all hover:bg-secondary/80 flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-primary" />
              Leaderboard
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
