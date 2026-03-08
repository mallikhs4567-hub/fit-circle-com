import { useState, useEffect } from 'react';
import { X, Trophy, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { type Challenge } from '@/hooks/useChallenges';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  progress: number;
  completed: boolean;
}

interface ChallengeLeaderboardProps {
  challenge: Challenge;
  getLeaderboard: (id: string) => Promise<LeaderboardEntry[]>;
  onClose: () => void;
}

const rankColors = [
  'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
  'from-gray-400/20 to-gray-500/5 border-gray-400/30',
  'from-amber-700/20 to-amber-800/5 border-amber-700/30',
];

export function ChallengeLeaderboard({ challenge, getLeaderboard, onClose }: ChallengeLeaderboardProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getLeaderboard(challenge.id);
      setEntries(data);
      setLoading(false);
    })();
  }, [challenge.id, getLeaderboard]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border safe-top">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-display uppercase tracking-wide text-foreground">Leaderboard</h2>
            <p className="text-[10px] text-muted-foreground">{challenge.title}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg bg-secondary press-effect">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">No participants yet</p>
        ) : (
          entries.map(entry => {
            const pct = Math.round((entry.progress / challenge.target_reps) * 100);
            const isMe = entry.userId === user?.id;
            const isTop3 = entry.rank <= 3;

            return (
              <div
                key={entry.userId}
                className={cn(
                  "card-elevated p-3 flex items-center gap-3 transition-all",
                  isMe && "border-primary/20 bg-primary/5",
                  isTop3 && !isMe && `bg-gradient-to-r ${rankColors[entry.rank - 1]}`
                )}
              >
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {isTop3 ? (
                    <span className="stat-value text-xl">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="stat-value text-sm text-muted-foreground">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                  isTop3 ? "gradient-primary text-primary-foreground" : "bg-secondary text-foreground"
                )}>
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} className="w-full h-full rounded-lg object-cover" alt="" />
                  ) : (
                    entry.username.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-sm font-semibold truncate", isMe ? "text-primary" : "text-foreground")}>
                      {entry.username}
                    </span>
                    {isMe && (
                      <span className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">You</span>
                    )}
                    {entry.completed && <Medal className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-secondary rounded overflow-hidden">
                      <div
                        className={cn("h-full rounded transition-all", entry.completed ? "gradient-primary" : "bg-primary/60")}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 stat-value">{pct}%</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="stat-value text-base text-foreground">{entry.progress}</p>
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider">reps</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
