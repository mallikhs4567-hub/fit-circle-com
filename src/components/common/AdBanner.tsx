import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  variant?: 'inline' | 'banner';
  className?: string;
}

export function AdBanner({ variant = 'inline', className }: AdBannerProps) {
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();

  // Don't show ads for premium users or while loading
  if (loading || isPremium) return null;

  const handleUpgrade = () => {
    navigate('/premium');
  };

  if (variant === 'banner') {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-6",
        className
      )}>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:20px_20px] animate-pulse" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Ad Space Available
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Remove ads and unlock premium features
            </p>
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Zap className="w-3 h-3" />
              Go Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30",
      className
    )}>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Crown className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">Sponsored</p>
        <p className="text-xs font-medium text-foreground">Ad placeholder</p>
      </div>
      <button
        onClick={handleUpgrade}
        className="text-xs text-primary hover:text-primary/80 font-medium shrink-0"
      >
        Remove ads →
      </button>
    </div>
  );
}