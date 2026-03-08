import { useEffect, useRef } from 'react';
import { Trophy, Zap, Star } from 'lucide-react';

interface ChallengeCompletionProps {
  title: string;
  targetReps: number;
  onClose: () => void;
}

function createConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [
    'hsl(0, 100%, 59%)',    // primary red
    'hsl(20, 100%, 55%)',   // streak orange
    'hsl(45, 100%, 60%)',   // gold
    'hsl(0, 0%, 96%)',      // white
    'hsl(0, 85%, 65%)',     // accent
  ];

  const particles: {
    x: number; y: number; w: number; h: number;
    vx: number; vy: number; rotation: number; rv: number;
    color: string; alpha: number;
  }[] = [];

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 4 + Math.random() * 6,
      h: 8 + Math.random() * 10,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
    });
  }

  let frame: number;
  let elapsed = 0;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elapsed++;

    particles.forEach(p => {
      p.x += p.vx;
      p.vy += 0.08;
      p.y += p.vy;
      p.rotation += p.rv;

      if (elapsed > 80) {
        p.alpha = Math.max(0, p.alpha - 0.015);
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (elapsed < 150) {
      frame = requestAnimationFrame(animate);
    }
  }

  frame = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frame);
}

export function ChallengeCompletion({ title, targetReps, onClose }: ChallengeCompletionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const xpReward = Math.min(50 + targetReps, 200);

  useEffect(() => {
    if (canvasRef.current) {
      const cleanup = createConfetti(canvasRef.current);
      return cleanup;
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 flex items-center justify-center p-6 animate-fade-in">
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-15 animate-pulse"
          style={{ background: 'radial-gradient(circle, hsl(0 100% 59%), transparent)' }}
        />
      </div>

      <div className="card-elevated p-8 max-w-sm w-full text-center space-y-6 relative z-20 animate-scale-in">
        {/* Trophy icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-xl gradient-primary glow-primary flex items-center justify-center animate-streak-pulse">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          {/* Floating stars */}
          <Star className="w-4 h-4 text-accent absolute -top-2 -right-2 animate-pulse" fill="currentColor" />
          <Star className="w-3 h-3 text-primary absolute -bottom-1 -left-2 animate-pulse" fill="currentColor" style={{ animationDelay: '0.3s' }} />
        </div>

        <div>
          <h2 className="text-2xl font-display uppercase tracking-wide text-foreground">
            Challenge Complete!
          </h2>
          <p className="text-sm text-muted-foreground mt-2">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {targetReps} reps achieved
          </p>
        </div>

        {/* XP Reward */}
        <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-primary/10 border border-primary/20">
          <Zap className="w-6 h-6 text-primary" />
          <span className="stat-value text-3xl text-primary">+{xpReward} XP</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-lg gradient-primary text-primary-foreground font-bold text-sm uppercase tracking-wider press-effect glow-primary"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
