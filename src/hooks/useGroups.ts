import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  category: string;
  privacy: string;
  avatar_url: string | null;
  created_by: string;
  member_count: number;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profile?: { username: string; avatar_url: string | null; xp: number | null };
}

export interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  created_at: string;
  profile?: { username: string; avatar_url: string | null };
}

export interface GroupChallenge {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  target_value: number;
  metric: string;
  duration_days: number;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  participant_count?: number;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { username: string; avatar_url: string | null };
}

export function useGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });
    setGroups((data as Group[]) || []);
    setLoading(false);
  }, []);

  const fetchMyGroups = useCallback(async () => {
    if (!user) return;
    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .eq('status', 'approved');
    if (memberData && memberData.length > 0) {
      const groupIds = memberData.map(m => m.group_id);
      const { data } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });
      setMyGroups((data as Group[]) || []);
    } else {
      setMyGroups([]);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
  }, [fetchGroups, fetchMyGroups]);

  const createGroup = async (name: string, description: string, category: string, privacy: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('groups')
      .insert({ name, description, category, privacy, created_by: user.id })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
    // Auto-add creator as admin
    await supabase.from('group_members').insert({
      group_id: data.id,
      user_id: user.id,
      role: 'admin',
      status: 'approved',
    });
    await fetchGroups();
    await fetchMyGroups();
    toast({ title: 'Group created!' });
    return data as Group;
  };

  const joinGroup = async (groupId: string, privacy: string) => {
    if (!user) return;
    const status = privacy === 'public' ? 'approved' : 'pending';
    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: user.id,
      status,
    });
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already a member or request pending' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      return;
    }
    toast({ title: privacy === 'public' ? 'Joined group!' : 'Request sent!' });
    await fetchGroups();
    await fetchMyGroups();
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);
    toast({ title: 'Left group' });
    await fetchGroups();
    await fetchMyGroups();
  };

  return { groups, myGroups, loading, createGroup, joinGroup, leaveGroup, refetch: () => { fetchGroups(); fetchMyGroups(); } };
}

export function useGroupDetail(groupId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [myMembership, setMyMembership] = useState<GroupMember | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);

    const [groupRes, membersRes, postsRes, challengesRes, messagesRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase.from('group_members').select('*').eq('group_id', groupId).eq('status', 'approved'),
      supabase.from('group_posts').select('*').eq('group_id', groupId).order('created_at', { ascending: false }).limit(50),
      supabase.from('group_challenges').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
      supabase.from('group_messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true }).limit(100),
    ]);

    setGroup(groupRes.data as Group | null);

    // Fetch profiles for members
    const rawMembers = (membersRes.data || []) as GroupMember[];
    if (rawMembers.length > 0) {
      const userIds = rawMembers.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, xp')
        .in('user_id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      rawMembers.forEach(m => {
        m.profile = profileMap.get(m.user_id) as any;
      });
    }
    setMembers(rawMembers);

    // Attach profiles to posts
    const rawPosts = (postsRes.data || []) as GroupPost[];
    if (rawPosts.length > 0) {
      const postUserIds = [...new Set(rawPosts.map(p => p.user_id))];
      const { data: postProfiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', postUserIds);
      const profileMap = new Map((postProfiles || []).map(p => [p.user_id, p]));
      rawPosts.forEach(p => {
        p.profile = profileMap.get(p.user_id) as any;
      });
    }
    setPosts(rawPosts);
    setChallenges((challengesRes.data || []) as GroupChallenge[]);

    // Attach profiles to messages
    const rawMessages = (messagesRes.data || []) as GroupMessage[];
    if (rawMessages.length > 0) {
      const msgUserIds = [...new Set(rawMessages.map(m => m.user_id))];
      const { data: msgProfiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', msgUserIds);
      const profileMap = new Map((msgProfiles || []).map(p => [p.user_id, p]));
      rawMessages.forEach(m => {
        m.profile = profileMap.get(m.user_id) as any;
      });
    }
    setMessages(rawMessages);

    if (user) {
      const mine = rawMembers.find(m => m.user_id === user.id);
      setMyMembership(mine || null);
    }

    setLoading(false);
  }, [groupId, user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime for messages
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` }, async (payload) => {
        const newMsg = payload.new as GroupMessage;
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .eq('user_id', newMsg.user_id)
          .single();
        newMsg.profile = profile as any;
        setMessages(prev => [...prev, newMsg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  const createPost = async (content: string, imageUrl?: string) => {
    if (!user || !groupId) return;
    const { error } = await supabase.from('group_posts').insert({
      group_id: groupId,
      user_id: user.id,
      content,
      image_url: imageUrl || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    fetchAll();
  };

  const sendMessage = async (content: string) => {
    if (!user || !groupId) return;
    await supabase.from('group_messages').insert({
      group_id: groupId,
      user_id: user.id,
      content,
    });
  };

  const createChallenge = async (title: string, description: string, targetValue: number, metric: string, durationDays: number) => {
    if (!user || !groupId) return;
    const { error } = await supabase.from('group_challenges').insert({
      group_id: groupId,
      created_by: user.id,
      title,
      description,
      target_value: targetValue,
      metric,
      duration_days: durationDays,
      ends_at: new Date(Date.now() + durationDays * 86400000).toISOString(),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Challenge created!' });
    fetchAll();
  };

  const approveMember = async (memberId: string) => {
    await supabase.from('group_members').update({ status: 'approved' }).eq('id', memberId);
    fetchAll();
  };

  return {
    group, members, posts, challenges, messages, myMembership, loading,
    createPost, sendMessage, createChallenge, approveMember, refetch: fetchAll,
  };
}
