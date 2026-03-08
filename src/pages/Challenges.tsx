import { useState, useMemo, useEffect, useRef } from 'react';
import { useChallenges, type Challenge } from '@/hooks/useChallenges';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { ChallengeLeaderboard } from '@/components/challenges/ChallengeLeaderboard';
import { ChallengeCompletion } from '@/components/challenges/ChallengeCompletion';
import { Trophy, Flame, Target, Globe, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type TabId = 'all' | 'my' | 'global' | 'completed';

export default function Challenges() {
  const navigate = useNavigate();
  const { challenges, myParticipations, loading, joinChallenge, getLeaderboard, getMyParticipation } = useChallenges();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [leaderboardChallenge, setLeaderboardChallenge] = useState<Challenge | null>(null);
  const [completedChallenge, setCompletedChallenge] = useState<Challenge | null>(null);
  const prevCompletedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const completedIds = new Set(myParticipations.filter(p => p.completed).map(p => p.challenge_id));
    const prev = prevCompletedRef.current;
    completedIds.forEach(id => {
      if (!prev.has(id)) {
        const c = challenges.find(ch => ch.id === id);
        if (c && prev.size > 0) setCompletedChallenge(c);
      }
    });
    prevCompletedRef.current = completedIds;
  }, [myParticipations, challenges]);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'my', label: 'Active', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'global', label: 'Global', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'completed', label: 'Done', icon: <Trophy className="w-3.5 h-3.5" /> },
  ];

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'my':
        return challenges.filter(c => { const p = getMyParticipation(c.id); return p && !p.completed; });
      case 'global':
        return challenges.filter(c => c.is_global);
      case 'completed':
        return challenges.filter(c => { const p = getMyParticipation(c.id); return p?.completed; });
      default:
        return challenges;
    }
  }, [activeTab, challenges, getMyParticipation]);

  const activeChallenges = myParticipations.filter(p => !p.completed).length;
  const completedCount = myParticipations.filter(p => p.completed).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {completedChallenge && (
        <ChallengeCompletion
          title={completedChallenge.title}
          targetReps={completedChallenge.target_reps}
          onClose={() => setCompletedChallenge(null)}
        />
      )}

      {leaderboardChallenge && (
        <ChallengeLeaderboard
          challenge={leaderboardChallenge}
          getLeaderboard={getLeaderboard}
          onClose={() => setLeaderboardChallenge(null)}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border"
        style={{ background: 'linear-gradient(180deg, hsl(0 0% 8% / 0.98), hsl(0 0% 6% / 0.95))' }}>
        <div className="px-4 pt-4 pb-3 safe-top">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/fitness')} className="p-2 rounded-lg bg-secondary press-effect">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-display uppercase tracking-wide text-foreground">Challenges</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {activeChallenges} active · {completedCount} done
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider press-effect",
                activeTab === tab.id
                  ? "gradient-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {activeTab === 'my' ? 'No active challenges' :
               activeTab === 'completed' ? 'No completed challenges' :
               'No challenges available'}
            </p>
          </div>
        ) : (
          filtered.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              participation={getMyParticipation(challenge.id)}
              onJoin={joinChallenge}
              onViewLeaderboard={(id) => {
                const c = challenges.find(ch => ch.id === id);
                if (c) setLeaderboardChallenge(c);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
