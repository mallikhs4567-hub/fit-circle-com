import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// AdSense ad slot configurations
// Replace these with your actual ad slot IDs from Google AdSense
const AD_SLOTS: Record<string, { slot: string; format: string; style: React.CSSProperties }> = {
  inline: {
    slot: '', // Add your ad slot ID here
    format: 'auto',
    style: { display: 'block', minHeight: 50 },
  },
  banner: {
    slot: '', // Add your ad slot ID here
    format: 'horizontal',
    style: { display: 'block', minHeight: 100 },
  },
  rectangle: {
    slot: '', // Add your ad slot ID here
    format: 'rectangle',
    style: { display: 'block', minHeight: 250 },
  },
  leaderboard: {
    slot: '', // Add your ad slot ID here
    format: 'horizontal',
    style: { display: 'block', minHeight: 50 },
  },
};

interface AdBannerProps {
  variant?: 'inline' | 'banner' | 'rectangle' | 'leaderboard';
  className?: string;
}

export function AdBanner({ variant = 'inline', className }: AdBannerProps) {
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (loading || isPremium || pushed.current) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // adsbygoogle not ready
    }
  }, [loading, isPremium]);

  if (loading || isPremium) return null;

  const config = AD_SLOTS[variant];

  return (
    <div className={cn('relative', className)}>
      <ins
        className="adsbygoogle"
        ref={adRef}
        style={{ ...config.style, width: '100%' }}
        data-ad-client="ca-pub-2081853320534961"
        data-ad-slot={config.slot}
        data-ad-format={config.format}
        data-full-width-responsive="true"
      />

      {/* Fallback / Remove ads prompt */}
      {!config.slot && (
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30",
        )}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Sponsored</p>
          </div>
          <button
            onClick={() => navigate('/premium')}
            className="text-xs text-primary hover:text-primary/80 font-medium shrink-0"
          >
            <Zap className="w-3 h-3 inline mr-1" />
            Remove ads
          </button>
        </div>
      )}
    </div>
  );
}
