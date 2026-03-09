import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Configure your Google Ad Manager ad units here ──
// Replace NETWORK_CODE with your GAM network code
// Replace AD_UNIT_PATH with your ad unit paths
const AD_CONFIG = {
  networkCode: '/NETWORK_CODE',
  units: {
    inline: { path: '/NETWORK_CODE/inline_feed', size: [320, 50] as [number, number] },
    banner: { path: '/NETWORK_CODE/banner_large', size: [320, 100] as [number, number] },
    rectangle: { path: '/NETWORK_CODE/rectangle', size: [300, 250] as [number, number] },
    leaderboard: { path: '/NETWORK_CODE/leaderboard', size: [320, 50] as [number, number] },
  },
};

interface AdBannerProps {
  variant?: 'inline' | 'banner' | 'rectangle' | 'leaderboard';
  className?: string;
}

let slotCounter = 0;

export function AdBanner({ variant = 'inline', className }: AdBannerProps) {
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const slotIdRef = useRef(`gam-ad-${variant}-${++slotCounter}`);

  useEffect(() => {
    if (loading || isPremium) return;

    const googletag = (window as any).googletag;
    if (!googletag?.cmd) return;

    const slotId = slotIdRef.current;
    const config = AD_CONFIG.units[variant];
    let adSlot: any = null;

    googletag.cmd.push(() => {
      adSlot = googletag
        .defineSlot(config.path, config.size, slotId)
        ?.addService(googletag.pubads());

      if (adSlot) {
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
        googletag.display(slotId);
        setAdLoaded(true);
      }
    });

    return () => {
      if (adSlot && googletag?.destroySlots) {
        googletag.cmd.push(() => {
          googletag.destroySlots([adSlot]);
        });
      }
    };
  }, [loading, isPremium, variant]);

  // Don't show for premium users or while loading
  if (loading || isPremium) return null;

  const config = AD_CONFIG.units[variant];

  return (
    <div className={cn('relative', className)}>
      {/* GAM Ad Container */}
      <div
        id={slotIdRef.current}
        ref={adRef}
        style={{
          minWidth: config.size[0],
          minHeight: config.size[1],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="mx-auto rounded-xl overflow-hidden"
      />

      {/* Fallback when ad doesn't load */}
      {!adLoaded && (
        <div className={cn(
          "absolute inset-0 flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30",
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
