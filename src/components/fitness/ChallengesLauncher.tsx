import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Flame, Users } from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';

export function ChallengesLauncher() {
  const navigate = useNavigate();
  const { myParticipations } = useChallenges();
  const active = myParticipations.filter(p => !p.completed).length;
  const completed = myParticipations.filter(p => p.completed).length;
  const [liveCount, setLiveCount] = useState(1847);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(prev => prev + Math.floor(Math.random() * 7) - 2);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={() => navigate('/challenges')}
      className="w-full card-elevated p-4 flex items-center gap-3 transition-all text-left press-effect group"
    >
      <div className="w-11 h-11 rounded-lg bg-streak/10 border border-streak/20 flex items-center justify-center shrink-0 group-hover:glow-streak transition-shadow">
        <Trophy className="w-5 h-5 text-streak group-hover:animate-float" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-display uppercase tracking-wide text-foreground">Challenges</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {active > 0 ? (
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-streak" />
              {active} active{completed > 0 && ` · ${completed} done`}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {liveCount.toLocaleString()} competing now
            </span>
          )}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}
