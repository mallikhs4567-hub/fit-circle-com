import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription, PLANS } from '@/hooks/useSubscription';
import { Crown, Zap, BrainCircuit, BarChart3, Users, Ban, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

const benefits = [
  { icon: BrainCircuit, text: 'Unlimited AI Coach' },
  { icon: Zap, text: 'AI Workout Tracking' },
  { icon: BarChart3, text: 'Advanced Analytics' },
  { icon: Users, text: 'Private Groups' },
  { icon: Ban, text: 'No Advertisements' },
  { icon: Sparkles, text: 'Premium Badge' },
];

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  const { startCheckout } = useSubscription();

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    await startCheckout(PLANS[plan].price_id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-card border-border">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 mx-auto mb-3 flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display font-bold text-foreground">
            Upgrade to FitCircle Premium
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {feature
              ? `${feature} requires Premium. Unlock all features!`
              : 'Unlock your full fitness potential'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-4">
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/50">
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Button
            className="w-full h-12 text-base font-bold"
            onClick={() => handleUpgrade('yearly')}
          >
            <Crown className="w-5 h-5 mr-2" />
            Yearly — {PLANS.yearly.price}/year
            <span className="ml-2 text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
              {PLANS.yearly.badge}
            </span>
          </Button>
          <Button
            variant="secondary"
            className="w-full h-10"
            onClick={() => handleUpgrade('monthly')}
          >
            Monthly — {PLANS.monthly.price}/month
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onClose}
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
