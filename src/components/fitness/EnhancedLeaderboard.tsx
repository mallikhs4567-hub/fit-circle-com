import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, ChevronDown, ChevronUp, Medal, Award, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  streak: number;
  badge: string;
}

function getBadge(rank: number): { label: string; icon: typeof Trophy } {
  if (rank === 1) return { label: 'Top 1%', icon: Trophy };
  if (rank <= 3) return { label: 'Elite', icon: Medal };
  if (rank <= 10) return { label: 'Warrior', icon: Shield };
  return { label: 'Fighter', icon: Award };
}

export function EnhancedLeaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);

    (async () => {
      // Get week start
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      const weekStart = monday.toISOString().split('T')[0];

      const { data: xpData } = await supabase
        .from('weekly_xp_leaderboard')
        .select('user_id, xp')
        .eq('week_start', weekStart)
        .order('xp', { ascending: false })
        .limit(20);

      if (!xpData || xpData.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = xpData.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, streak')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const entries: LeaderboardEntry[] = xpData.map((d, i) => {
        const p = profileMap.get(d.user_id);
        return {
          user_id: d.user_id,
          username: p?.username || 'User',
          avatar_url: p?.avatar_url || null,
          xp: d.xp,
          streak: p?.streak || 0,
          badge: getBadge(i + 1).label,
        };
      });

      setEntries(entries);
      setLoading(false);
    })();
  }, [expanded]);

  return (
    <div className="card-elevated overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4"
      >
        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4 text-accent" />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground text-left">Leaderboard</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 animate-fade-up">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No leaderboard data this week</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => {
                const { icon: BadgeIcon } = getBadge(i + 1);
                const isMe = entry.user_id === user?.id;
                return (
                  <button
                    key={entry.user_id}
                    onClick={() => navigate(`/user/${entry.user_id}`)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left",
                      isMe ? "bg-primary/10 border border-primary/20" : "bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    {/* Rank */}
                    <span className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      i === 0 ? "gradient-primary text-primary-foreground" :
                      i === 1 ? "gradient-accent text-accent-foreground" :
                      i === 2 ? "bg-muted text-foreground" :
                      "bg-secondary text-muted-foreground"
                    )}>
                      {i + 1}
                    </span>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {entry.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium truncate", isMe ? "text-primary" : "text-foreground")}>
                        {entry.username} {isMe && '(You)'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">🔥 {entry.streak}</span>
                        <span className="text-[10px] text-primary/80">{entry.badge}</span>
                      </div>
                    </div>

                    {/* XP */}
                    <span className="text-sm font-display font-bold text-primary shrink-0">
                      {entry.xp} XP
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
