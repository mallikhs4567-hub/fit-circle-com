import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  goal: 'weight-loss' | 'muscle-gain' | 'yoga' | 'runner' | 'general-fitness' | 'healthy-routine' | null;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | null;
  height: number | null;
  weight: number | null;
  gender: 'male' | 'female' | 'other' | null;
  streak: number;
  total_active_days: number;
  created_at: string;
  updated_at: string;
  bio: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: loading, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      return data as Profile;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const data = await updateMutation.mutateAsync(updates);
      return { data, error: null };
    } catch (error) {
      return { error };
    }
  };

  const isOnboarded = !!profile?.goal && !!profile?.height && !!profile?.weight && !!profile?.gender;

  return {
    profile: profile ?? null,
    loading,
    updateProfile,
    refetch,
    isOnboarded,
  };
}
