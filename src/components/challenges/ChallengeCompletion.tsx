import { Trophy, Zap } from 'lucide-react';

interface ChallengeCompletionProps {
  title: string;
  targetReps: number;
  onClose: () => void;
}

export function ChallengeCompletion({ title, targetReps, onClose }: ChallengeCompletionProps) {
  const points = Math.round(targetReps * 1);

  return (
    <div className="fixed inset-0 z-[60] bg-background/98 flex items-center justify-center p-6 animate-fade-in">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-15 animate-pulse"
          style={{ background: 'radial-gradient(circle, hsl(0 100% 59%), transparent)' }} />
      </div>

      <div className="card-elevated p-8 max-w-sm w-full text-center space-y-6 relative animate-scale-in">
        <div className="w-20 h-20 rounded-xl gradient-primary glow-primary mx-auto flex items-center justify-center">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>

        <div>
          <h2 className="text-2xl font-display uppercase tracking-wide text-foreground">Challenge Complete</h2>
          <p className="text-sm text-muted-foreground mt-2">{title}</p>
        </div>

        <div className="flex items-center justify-center gap-2 py-2">
          <Zap className="w-6 h-6 text-primary" />
          <span className="stat-value text-3xl text-primary">+{points} XP</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-lg gradient-primary text-primary-foreground font-bold text-sm uppercase tracking-wider press-effect"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
