import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription, PLANS } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import {
  ArrowLeft, Crown, Check, BrainCircuit, Zap, BarChart3,
  Users, Ban, Sparkles, Target, Dumbbell, Apple, Star,
  Settings2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const features = [
  { name: 'Basic Workouts', free: true, premium: true, icon: Dumbbell },
  { name: 'Public Challenges', free: true, premium: true, icon: Target },
  { name: 'AI Coach', free: '3/day', premium: 'Unlimited', icon: BrainCircuit },
  { name: 'AI Camera Tracking', free: '5 min', premium: 'Unlimited', icon: Zap },
  { name: 'Progress Analytics', free: 'Basic', premium: 'Advanced', icon: BarChart3 },
  { name: 'Create Challenges', free: false, premium: true, icon: Target },
  { name: 'Private Groups', free: false, premium: true, icon: Users },
  { name: 'AI Diet Plans', free: false, premium: true, icon: Apple },
  { name: 'Premium Badge', free: false, premium: true, icon: Crown },
  { name: 'No Ads', free: false, premium: true, icon: Ban },
  { name: 'Early Access', free: false, premium: true, icon: Sparkles },
];

const testimonials = [
  { name: 'Rahul M.', text: 'Premium AI Coach changed my routine completely. Lost 8kg in 3 months!' },
  { name: 'Priya K.', text: 'The advanced analytics helped me understand my body better.' },
  { name: 'Arjun S.', text: 'Private groups with my gym buddies keep me motivated daily.' },
];

export default function Premium() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPremium, subscriptionEnd, loading, startCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Welcome to Premium! 🎉');
      checkSubscription();
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled');
    }
  }, [searchParams, checkSubscription]);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    await startCheckout(PLANS[selectedPlan].price_id);
    setCheckoutLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold text-foreground flex-1">
            FitCircle Premium
          </h1>
          {isPremium && <PremiumBadge size="md" />}
        </div>
      </header>

      {/* Hero */}
      <div className="px-4 py-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/20 mx-auto mb-4 flex items-center justify-center"
          style={{ boxShadow: 'var(--shadow-glow)' }}>
          <Crown className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          {isPremium ? 'You\'re Premium!' : 'Unlock Your Full Potential'}
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          {isPremium
            ? `Your subscription is active until ${subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : 'renewal'}`
            : 'Get unlimited AI coaching, advanced analytics, and more'}
        </p>
      </div>

      {/* Current subscriber actions */}
      {isPremium && (
        <div className="px-4 mb-6 space-y-2">
          <Button variant="outline" className="w-full" onClick={openCustomerPortal}>
            <Settings2 className="w-4 h-4 mr-2" />
            Manage Subscription
          </Button>
        </div>
      )}

      {/* Plan selector - only show for free users */}
      {!isPremium && (
        <>
          <div className="px-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              {(['monthly', 'yearly'] as const).map((plan) => {
                const p = PLANS[plan];
                const isSelected = selectedPlan === plan;
                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "relative p-4 rounded-2xl border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    {'badge' in p && p.badge && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                        {p.badge}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground font-medium">{p.name}</p>
                    <p className="text-xl font-display font-bold text-foreground mt-1">{p.price}</p>
                    <p className="text-[10px] text-muted-foreground">/{p.interval}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 mb-6">
            <Button
              className="w-full h-14 text-lg font-bold"
              onClick={handleUpgrade}
              disabled={checkoutLoading || loading}
            >
              {checkoutLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Crown className="w-5 h-5 mr-2" />
              )}
              Upgrade Now
            </Button>
          </div>
        </>
      )}

      {/* Feature comparison */}
      <div className="px-4 mb-6">
        <h3 className="section-header mb-3">Feature Comparison</h3>
        <div className="card-elevated overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-3 gap-2 p-3 border-b border-border bg-secondary/30">
            <span className="text-xs font-bold text-muted-foreground">Feature</span>
            <span className="text-xs font-bold text-muted-foreground text-center">Free</span>
            <span className="text-xs font-bold text-primary text-center">Premium</span>
          </div>
          {features.map(({ name, free, premium, icon: Icon }) => (
            <div key={name} className="grid grid-cols-3 gap-2 p-3 border-b border-border/50 items-center">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-foreground">{name}</span>
              </div>
              <div className="text-center">
                {free === true ? (
                  <Check className="w-4 h-4 text-success mx-auto" />
                ) : free === false ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">{free}</span>
                )}
              </div>
              <div className="text-center">
                {premium === true ? (
                  <Check className="w-4 h-4 text-primary mx-auto" />
                ) : (
                  <span className="text-[10px] text-primary font-bold">{premium}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="px-4 mb-6">
        <h3 className="section-header mb-3">What Members Say</h3>
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div key={t.name} className="card-elevated p-4">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-2">"{t.text}"</p>
              <p className="text-xs text-muted-foreground font-bold">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
