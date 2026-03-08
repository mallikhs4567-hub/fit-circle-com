import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useXP } from '@/hooks/useXP';
import { toast } from 'sonner';

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  exercise_type: string;
  target_reps: number;
  duration_days: number;
  is_global: boolean;
  global_target: number | null;
  created_at: string;
  ends_at: string | null;
  participant_count: number;
  global_progress: number;
}

export interface ChallengeParticipant {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  start_date: string;
}

export function useChallenges() {
  const { user } = useAuth();
  const { awardXP } = useXP();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myParticipations, setMyParticipations] = useState<ChallengeParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    // Fetch all challenges
    const { data: challengeRows } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (!challengeRows) { setLoading(false); return; }

    // Get participant counts per challenge
    const { data: allParticipants } = await supabase
      .from('challenge_participants')
      .select('challenge_id, progress');

    const countMap = new Map<string, number>();
    const globalProgressMap = new Map<string, number>();
    (allParticipants || []).forEach(p => {
      countMap.set(p.challenge_id, (countMap.get(p.challenge_id) || 0) + 1);
      globalProgressMap.set(p.challenge_id, (globalProgressMap.get(p.challenge_id) || 0) + p.progress);
    });

    setChallenges(challengeRows.map(c => ({
      ...c,
      participant_count: countMap.get(c.id) || 0,
      global_progress: globalProgressMap.get(c.id) || 0,
    })));

    // Fetch my participations
    if (user) {
      const { data: myData } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('user_id', user.id);
      setMyParticipations((myData as ChallengeParticipant[]) || []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('challenge-participants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_participants' }, () => {
        fetchChallenges();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchChallenges]);

  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user) return false;
    const existing = myParticipations.find(p => p.challenge_id === challengeId);
    if (existing) { toast.info('Already joined!'); return false; }

    const { error } = await supabase.from('challenge_participants').insert({
      user_id: user.id,
      challenge_id: challengeId,
    });

    if (error) {
      toast.error('Failed to join challenge');
      return false;
    }
    toast.success('Challenge joined! 💪');
    await fetchChallenges();
    return true;
  }, [user, myParticipations, fetchChallenges]);

  const getLeaderboard = useCallback(async (challengeId: string) => {
    const { data } = await supabase
      .from('challenge_participants')
      .select('user_id, progress, completed')
      .eq('challenge_id', challengeId)
      .order('progress', { ascending: false })
      .limit(50);

    if (!data || data.length === 0) return [];

    const userIds = data.map(d => d.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    return data.map((d, idx) => ({
      rank: idx + 1,
      userId: d.user_id,
      username: profileMap.get(d.user_id)?.username || 'User',
      avatarUrl: profileMap.get(d.user_id)?.avatar_url || null,
      progress: d.progress,
      completed: d.completed,
    }));
  }, []);

  const getMyParticipation = useCallback((challengeId: string) => {
    return myParticipations.find(p => p.challenge_id === challengeId) || null;
  }, [myParticipations]);

  return {
    challenges,
    myParticipations,
    loading,
    joinChallenge,
    getLeaderboard,
    getMyParticipation,
    refetch: fetchChallenges,
  };
}
