import { Trophy, Sparkles, Zap } from 'lucide-react';

interface ChallengeCompletionProps {
  title: string;
  targetReps: number;
  onClose: () => void;
}

export function ChallengeCompletion({ title, targetReps, onClose }: ChallengeCompletionProps) {
  const points = Math.round(targetReps * 1);

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      {/* Glow effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, hsl(82 85% 55%), transparent)' }} />
      </div>

      <div className="card-elevated p-8 max-w-sm w-full text-center space-y-5 relative animate-scale-in">
        {/* Confetti sparkles */}
        <div className="absolute -top-3 -right-3">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="absolute -top-2 -left-2">
          <Sparkles className="w-6 h-6 text-accent animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="w-20 h-20 rounded-full gradient-primary glow-primary mx-auto flex items-center justify-center">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>

        <div>
          <h2 className="text-xl font-display font-bold text-foreground">🎉 Challenge Complete!</h2>
          <p className="text-sm text-muted-foreground mt-2">{title}</p>
        </div>

        <div className="flex items-center justify-center gap-2 py-2">
          <Zap className="w-6 h-6 text-primary" />
          <span className="text-2xl font-display font-bold text-primary">+{points} XP</span>
        </div>

        <p className="text-xs text-muted-foreground">
          You've earned a badge for completing this challenge!
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover-scale"
        >
          Awesome! 🔥
        </button>
      </div>
    </div>
  );
}
