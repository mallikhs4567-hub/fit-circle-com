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

const rankBadges = ['🥇', '🥈', '🥉'];

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
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-display font-bold text-foreground">Leaderboard</h2>
            <p className="text-[10px] text-muted-foreground">{challenge.title}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-secondary">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No participants yet</p>
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
                  isMe && "ring-1 ring-primary/30 bg-primary/5",
                  isTop3 && "shadow-md"
                )}
              >
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {isTop3 ? (
                    <span className="text-lg">{rankBadges[entry.rank - 1]}</span>
                  ) : (
                    <span className="text-sm font-display font-bold text-muted-foreground">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  isTop3 ? "gradient-primary text-primary-foreground" : "bg-secondary text-foreground"
                )}>
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
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
                    {isMe && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">You</span>}
                    {entry.completed && <Medal className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", entry.completed ? "gradient-primary" : "bg-primary/60")}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{pct}%</span>
                  </div>
                </div>

                {/* Reps */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-display font-bold text-foreground">{entry.progress}</p>
                  <p className="text-[9px] text-muted-foreground">reps</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
