import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { demoFriends, demoPendingRequests } from '@/lib/demoData';

export interface Friend {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  streak: number;
}

export function useFriends() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: friendsData, isLoading: loading, refetch } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) return { friends: [], pendingRequests: [] };

      // Get accepted friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (error) {
        console.error('Error fetching friendships:', error);
        return { friends: [], pendingRequests: [] };
      }

      // Get friend user IDs
      const friendIds = friendships?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      let friends: Friend[] = [];
      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url, streak')
          .in('user_id', friendIds);
        friends = profiles as Friend[] || [];
      } else {
        // Use demo friends when no real friends exist
        friends = demoFriends.map(df => ({
          id: df.id,
          user_id: df.user_id,
          username: df.username,
          avatar_url: df.avatar_url,
          streak: df.streak,
        }));
      }

      // Get pending requests (received)
      const { data: pending } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      let pendingRequests: Friend[] = [];
      if (pending && pending.length > 0) {
        const pendingIds = pending.map(p => p.user_id);
        const { data: pendingProfiles } = await supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url, streak')
          .in('user_id', pendingIds);
        pendingRequests = pendingProfiles as Friend[] || [];
      } else {
        // Show demo pending requests
        pendingRequests = demoPendingRequests.map(dp => ({
          id: dp.id,
          user_id: dp.user_id,
          username: dp.username,
          avatar_url: dp.avatar_url,
          streak: dp.streak,
        }));
      }

      // Get sent requests (outgoing)
      const { data: sent } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      let sentRequests: Friend[] = [];
      if (sent && sent.length > 0) {
        const sentIds = sent.map(s => s.friend_id);
        const { data: sentProfiles } = await supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url, streak')
          .in('user_id', sentIds);
        sentRequests = sentProfiles as Friend[] || [];
      }

      return { friends, pendingRequests, sentRequests };
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (friendUsername: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data: profiles, error: findError } = await supabase
        .rpc('search_users_by_username', { search_username: friendUsername });

      const profile = profiles?.find(
        (p: { username: string }) => p.username.toLowerCase() === friendUsername.toLowerCase()
      );

      if (findError || !profile) {
        throw new Error('User not found');
      }

      if (profile.user_id === user.id) {
        throw new Error("You can't add yourself as a friend!");
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: profile.user_id,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Friend request already sent');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Friend request sent!');
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (friendUserId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id', friendUserId)
        .eq('friend_id', user.id);

      if (error) throw error;
    },
    onMutate: async (friendUserId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['friends', user?.id] });
      const previous = queryClient.getQueryData(['friends', user?.id]);
      
      queryClient.setQueryData(['friends', user?.id], (old: any) => {
        if (!old) return old;
        const accepted = old.pendingRequests.find((r: Friend) => r.user_id === friendUserId);
        return {
          friends: accepted ? [...old.friends, accepted] : old.friends,
          pendingRequests: old.pendingRequests.filter((r: Friend) => r.user_id !== friendUserId),
        };
      });
      
      return { previous };
    },
    onSuccess: () => {
      toast.success('Friend added!');
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['friends', user?.id], context?.previous);
      toast.error('Failed to accept request');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (friendUserId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('user_id', friendUserId)
        .eq('friend_id', user.id);

      if (error) throw error;
    },
    onMutate: async (friendUserId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['friends', user?.id] });
      const previous = queryClient.getQueryData(['friends', user?.id]);
      
      queryClient.setQueryData(['friends', user?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pendingRequests: old.pendingRequests.filter((r: Friend) => r.user_id !== friendUserId),
        };
      });
      
      return { previous };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['friends', user?.id], context?.previous);
      toast.error('Failed to reject request');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
    },
  });

  const sendFriendRequest = async (friendUsername: string) => {
    try {
      await sendRequestMutation.mutateAsync(friendUsername);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const acceptFriendRequest = async (friendUserId: string) => {
    try {
      await acceptRequestMutation.mutateAsync(friendUserId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const rejectFriendRequest = async (friendUserId: string) => {
    try {
      await rejectRequestMutation.mutateAsync(friendUserId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return {
    friends: friendsData?.friends ?? [],
    pendingRequests: friendsData?.pendingRequests ?? [],
    sentRequests: friendsData?.sentRequests ?? [],
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    refetch,
  };
}
