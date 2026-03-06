import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'rings' | 'text' | 'exit'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('rings'), 400);
    const t2 = setTimeout(() => setPhase('text'), 1000);
    const t3 = setTimeout(() => setPhase('exit'), 2200);
    const t4 = setTimeout(onComplete, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center transition-opacity duration-500",
        phase === 'exit' && "opacity-0 pointer-events-none"
      )}
    >
      {/* Radial glow background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full transition-all duration-1000",
            phase === 'logo' ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
          style={{ background: 'radial-gradient(circle, hsl(82 85% 55% / 0.08) 0%, transparent 70%)' }}
        />
      </div>

      {/* Animated rings */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 rounded-full border transition-all",
              i === 0 && "border-primary/40",
              i === 1 && "border-primary/20",
              i === 2 && "border-primary/10",
              phase === 'logo' && "scale-0 opacity-0",
              phase !== 'logo' && "opacity-100"
            )}
            style={{
              transform: phase !== 'logo' ? `scale(${1 + i * 0.3})` : 'scale(0)',
              transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 150}ms`,
            }}
          />
        ))}

        {/* Dumbbell icon */}
        <div
          className={cn(
            "relative z-10 transition-all duration-700",
            phase === 'logo' ? "scale-0 rotate-[-180deg]" : "scale-100 rotate-0"
          )}
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="drop-shadow-[0_0_30px_hsl(82_85%_55%/0.5)]">
            {/* Dumbbell shape */}
            <rect x="8" y="24" width="12" height="24" rx="3" fill="hsl(82, 85%, 55%)" className="splash-bar-left" />
            <rect x="52" y="24" width="12" height="24" rx="3" fill="hsl(82, 85%, 55%)" className="splash-bar-right" />
            <rect x="20" y="30" width="32" height="12" rx="2" fill="hsl(82, 85%, 45%)" />
            <rect x="4" y="28" width="8" height="16" rx="2" fill="hsl(82, 85%, 60%)" />
            <rect x="60" y="28" width="8" height="16" rx="2" fill="hsl(82, 85%, 60%)" />
          </svg>
        </div>
      </div>

      {/* App name */}
      <div
        className={cn(
          "mt-8 text-center transition-all duration-700",
          phase === 'text' || phase === 'exit' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <h1
          className="text-4xl font-display font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, hsl(82, 85%, 55%), hsl(82, 85%, 70%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          FitCircle
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5 font-medium tracking-wide">
          TRAIN · TRACK · TRANSFORM
        </p>
      </div>

      {/* Loading dots */}
      <div className={cn(
        "flex gap-1.5 mt-10 transition-opacity duration-500",
        phase === 'text' || phase === 'exit' ? "opacity-100" : "opacity-0"
      )}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            style={{
              animation: 'splash-dot 1.2s ease-in-out infinite',
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-dot {
          0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        .splash-bar-left { animation: splash-lift-left 0.6s ease-out 0.8s both; }
        .splash-bar-right { animation: splash-lift-right 0.6s ease-out 0.8s both; }
        @keyframes splash-lift-left {
          0%, 50% { transform: translateY(0); }
          25% { transform: translateY(-4px); }
        }
        @keyframes splash-lift-right {
          0%, 50% { transform: translateY(0); }
          25% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
