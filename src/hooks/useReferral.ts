import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

const REFERRALS_NEEDED = 3;

interface ReferralState {
  referralCode: string | null;
  completedReferrals: number;
  loading: boolean;
}

export function useReferral() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [state, setState] = useState<ReferralState>({
    referralCode: null,
    completedReferrals: 0,
    loading: true,
  });

  const fetchReferralData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Get referral code from profile
      const referralCode = (profile as any)?.referral_code ?? null;

      // Count completed referrals
      const { count, error } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_id', user.id)
        .eq('status', 'completed');

      setState({
        referralCode: referralCode,
        completedReferrals: error ? 0 : (count ?? 0),
        loading: false,
      });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, profile]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const getReferralLink = useCallback(() => {
    if (!state.referralCode) return '';
    return `${window.location.origin}/auth?ref=${state.referralCode}`;
  }, [state.referralCode]);

  const shareReferralLink = useCallback(async () => {
    const link = getReferralLink();
    if (!link) return;

    const shareData = {
      title: 'Join FitCircle!',
      text: 'Join me on FitCircle - the ultimate fitness social app! Use my referral link to sign up:',
      url: link,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(link);
        toast.success('Referral link copied to clipboard!');
      }
    } catch {
      await navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    }
  }, [getReferralLink]);

  const progress = Math.min(state.completedReferrals, REFERRALS_NEEDED);
  const hasEarnedReward = state.completedReferrals >= REFERRALS_NEEDED;

  return {
    ...state,
    referralLink: getReferralLink(),
    shareReferralLink,
    progress,
    total: REFERRALS_NEEDED,
    hasEarnedReward,
    refetch: fetchReferralData,
  };
}
