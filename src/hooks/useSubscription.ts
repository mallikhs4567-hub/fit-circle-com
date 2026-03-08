import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Stripe product/price mapping
export const PLANS = {
  monthly: {
    price_id: 'price_1T8hzPK7siLMzyS1yLPYmWRG',
    product_id: 'prod_U6vrIa9tqATZbn',
    name: 'Monthly',
    price: '₹199',
    priceNum: 199,
    interval: 'month',
  },
  yearly: {
    price_id: 'price_1T8hzgK7siLMzyS1QmadRIWS',
    product_id: 'prod_U6vrTjdYBz6FNh',
    name: 'Yearly',
    price: '₹1,499',
    priceNum: 1499,
    interval: 'year',
    badge: 'Save 37%',
  },
} as const;

// Free tier limits
export const FREE_LIMITS = {
  ai_coach: 3,        // requests per day
  ai_camera: 5,       // minutes per session (tracked as count)
} as const;

export type PlanType = 'free' | 'premium';

interface SubscriptionState {
  plan: PlanType;
  subscribed: boolean;
  subscriptionEnd: string | null;
  productId: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    plan: 'free',
    subscribed: false,
    subscriptionEnd: null,
    productId: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      setState({
        plan: data.subscribed ? 'premium' : 'free',
        subscribed: data.subscribed,
        subscriptionEnd: data.subscription_end,
        productId: data.product_id,
        loading: false,
      });
    } catch (err) {
      console.error('Subscription check failed:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [session?.access_token]);

  // Check on mount and periodically
  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000); // every minute
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startCheckout = useCallback(async (priceId: string) => {
    if (!session?.access_token) {
      toast.error('Please log in first');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout');
    }
  }, [session?.access_token]);

  const openCustomerPortal = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      toast.error('Failed to open subscription management');
    }
  }, [session?.access_token]);

  // Feature usage tracking
  const checkFeatureAccess = useCallback(async (featureName: string): Promise<boolean> => {
    if (state.subscribed) return true;

    const limit = FREE_LIMITS[featureName as keyof typeof FREE_LIMITS];
    if (!limit) return true; // No limit for this feature

    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('feature_usage')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('feature_name', featureName)
      .eq('date', today)
      .maybeSingle();

    return (data?.usage_count ?? 0) < limit;
  }, [state.subscribed, user]);

  const incrementFeatureUsage = useCallback(async (featureName: string) => {
    if (!user || state.subscribed) return;

    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('feature_usage')
      .select('id, usage_count')
      .eq('user_id', user.id)
      .eq('feature_name', featureName)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('feature_usage')
        .update({ usage_count: existing.usage_count + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('feature_usage')
        .insert({ user_id: user.id, feature_name: featureName, usage_count: 1, date: today });
    }
  }, [user, state.subscribed]);

  const getRemainingUsage = useCallback(async (featureName: string): Promise<number> => {
    if (state.subscribed) return Infinity;

    const limit = FREE_LIMITS[featureName as keyof typeof FREE_LIMITS];
    if (!limit || !user) return 0;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('feature_usage')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('feature_name', featureName)
      .eq('date', today)
      .maybeSingle();

    return Math.max(0, limit - (data?.usage_count ?? 0));
  }, [state.subscribed, user]);

  return {
    ...state,
    isPremium: state.subscribed,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
    checkFeatureAccess,
    incrementFeatureUsage,
    getRemainingUsage,
  };
}
