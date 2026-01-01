import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Friend {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  streak: number;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    if (!user) {
      setFriends([]);
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    // Get accepted friendships
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friendships:', error);
      setLoading(false);
      return;
    }

    // Get friend user IDs
    const friendIds = friendships?.map(f => 
      f.user_id === user.id ? f.friend_id : f.user_id
    ) || [];

    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, username, avatar_url, streak')
        .in('user_id', friendIds);

      setFriends(profiles as Friend[] || []);
    } else {
      setFriends([]);
    }

    // Get pending requests
    const { data: pending } = await supabase
      .from('friendships')
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (pending && pending.length > 0) {
      const pendingIds = pending.map(p => p.user_id);
      const { data: pendingProfiles } = await supabase
        .from('profiles')
        .select('id, user_id, username, avatar_url, streak')
        .in('user_id', pendingIds);

      setPendingRequests(pendingProfiles as Friend[] || []);
    } else {
      setPendingRequests([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  const sendFriendRequest = async (friendUsername: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Find user by username
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', friendUsername.toLowerCase())
      .maybeSingle();

    if (findError || !profile) {
      toast.error('User not found');
      return { error: findError || new Error('User not found') };
    }

    if (profile.user_id === user.id) {
      toast.error("You can't add yourself as a friend!");
      return { error: new Error('Cannot add self') };
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
        toast.error('Friend request already sent');
      } else {
        toast.error('Failed to send friend request');
      }
      return { error };
    }

    toast.success('Friend request sent!');
    return { error: null };
  };

  const acceptFriendRequest = async (friendUserId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('user_id', friendUserId)
      .eq('friend_id', user.id);

    if (error) {
      toast.error('Failed to accept request');
      return { error };
    }

    toast.success('Friend added!');
    fetchFriends();
    return { error: null };
  };

  const rejectFriendRequest = async (friendUserId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('user_id', friendUserId)
      .eq('friend_id', user.id);

    if (error) {
      toast.error('Failed to reject request');
      return { error };
    }

    fetchFriends();
    return { error: null };
  };

  return {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    refetch: fetchFriends,
  };
}
