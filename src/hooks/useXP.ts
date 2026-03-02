import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const XP_REWARDS = {
  workout_completed: 20,
  diet_completed: 15,
  post_created: 10,
  comment: 5,
  daily_login: 5,
} as const;

export type XPAction = keyof typeof XP_REWARDS;

const XP_LABELS: Record<XPAction, string> = {
  workout_completed: 'Workout Done',
  diet_completed: 'Diet Followed',
  post_created: 'New Post',
  comment: 'Comment',
  daily_login: 'Daily Login',
};

export function getLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXPInCurrentLevel(xp: number): number {
  return xp % 100;
}

export function useXP() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const awardXP = useCallback(async (action: XPAction): Promise<{ leveledUp: boolean; newLevel: number } | null> => {
    if (!user) return null;
    const amount = XP_REWARDS[action];

    const { data, error } = await supabase.rpc('award_xp', {
      p_user_id: user.id,
      p_amount: amount,
    });

    if (error) {
      console.error('Error awarding XP:', error);
      return null;
    }

    const result = data?.[0];
    if (!result) return null;

    // Show +XP toast
    toast(`+${amount} XP — ${XP_LABELS[action]}`, {
      duration: 2000,
      className: 'xp-toast',
      icon: '⚡',
    });

    // Invalidate profile to refresh XP/level everywhere
    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

    return {
      leveledUp: result.leveled_up,
      newLevel: result.new_level,
    };
  }, [user, queryClient]);

  const fetchWeeklyLeaderboard = useCallback(async () => {
    const weekStart = getWeekStart();
    const { data, error } = await supabase
      .from('weekly_xp_leaderboard')
      .select('user_id, xp')
      .eq('week_start', weekStart)
      .order('xp', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
    return data || [];
  }, []);

  return { awardXP, fetchWeeklyLeaderboard };
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}
