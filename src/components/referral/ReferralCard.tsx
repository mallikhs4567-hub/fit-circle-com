import { useReferral } from '@/hooks/useReferral';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Gift, Share2, Users, Crown, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ReferralCardProps {
  className?: string;
  compact?: boolean;
}

export function ReferralCard({ className, compact = false }: ReferralCardProps) {
  const { referralCode, referralLink, shareReferralLink, progress, total, hasEarnedReward, loading } = useReferral();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !referralCode) return null;

  const progressPercent = (progress / total) * 100;

  if (compact) {
    return (
      <button
        onClick={shareReferralLink}
        className={cn(
          "w-full flex items-center gap-3 py-3.5 px-4 card-elevated rounded-xl",
          className
        )}
      >
        <Gift className="w-4 h-4 text-primary" />
        <span className="flex-1 text-sm font-medium text-foreground text-left">
          Invite Friends — Earn Premium
        </span>
        <span className="text-xs text-primary font-bold">{progress}/{total}</span>
      </button>
    );
  }

  return (
    <div className={cn("card-elevated overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 pb-3 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-display font-bold text-foreground">
            Invite Friends, Earn Premium
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Invite {total} friends and get <span className="text-primary font-bold">7 days free Premium</span>
        </p>
      </div>

      {/* Progress */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Friends joined</span>
          </div>
          <span className="text-sm font-bold text-foreground">
            {progress}/{total}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        
        {hasEarnedReward && (
          <div className="mt-2 flex items-center gap-1.5 text-primary">
            <Crown className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Premium unlocked! 🎉</span>
          </div>
        )}
      </div>

      {/* Referral code + actions */}
      <div className="px-4 pb-4 space-y-2">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border">
          <span className="flex-1 text-xs font-mono font-bold text-foreground tracking-wider">
            {referralCode}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </div>

        <Button onClick={shareReferralLink} className="w-full" size="sm">
          <Share2 className="w-4 h-4 mr-1.5" />
          Share Invite Link
        </Button>
      </div>
    </div>
  );
}
