import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  goal: 'weight-loss' | 'muscle-gain' | 'healthy-routine' | null;
  height: number | null;
  weight: number | null;
  gender: 'male' | 'female' | 'other' | null;
  streak: number;
  total_active_days: number;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } else {
      setProfile(data as Profile);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update profile');
      return { error };
    }

    setProfile(data as Profile);
    return { data, error: null };
  };

  const isOnboarded = !!profile?.goal && !!profile?.height && !!profile?.weight && !!profile?.gender;

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile,
    isOnboarded,
  };
}
