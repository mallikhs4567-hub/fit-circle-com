import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { demoChatThreads, demoChatMessagesMap, DemoChatMessage } from '@/lib/demoData';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface ChatThread {
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function useChat(selectedUserId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [demoMessages, setDemoMessages] = useState<Record<string, DemoChatMessage[]>>({ ...demoChatMessagesMap });

  // Fetch threads with React Query
  const { data: threads = [], isLoading: loading, refetch: refetchThreads } = useQuery({
    queryKey: ['chat-threads', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      // Group by conversation partner
      const threadMap = new Map<string, ChatMessage[]>();
      messagesData?.forEach((msg: ChatMessage) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!threadMap.has(partnerId)) {
          threadMap.set(partnerId, []);
        }
        threadMap.get(partnerId)!.push(msg);
      });

      const partnerIds = Array.from(threadMap.keys());
      
      if (partnerIds.length === 0) {
        return demoChatThreads.map(dt => ({
          participantId: dt.participantId,
          participantName: dt.participantName,
          participantAvatar: dt.participantAvatar,
          lastMessage: dt.lastMessage,
          lastMessageAt: dt.lastMessageTime,
          unreadCount: dt.unreadCount,
        }));
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', partnerIds);

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, p]) || []
      );

      const threadList: ChatThread[] = partnerIds.map(partnerId => {
        const msgs = threadMap.get(partnerId)!;
        const latestMsg = msgs[0];
        const profile = profileMap.get(partnerId);
        const unreadCount = msgs.filter(m => 
          m.sender_id === partnerId && !m.read_at
        ).length;

        return {
          participantId: partnerId,
          participantName: profile?.username || 'Unknown',
          participantAvatar: profile?.avatar_url || null,
          lastMessage: latestMsg.content,
          lastMessageAt: latestMsg.created_at,
          unreadCount,
        };
      });

      threadList.sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      return threadList;
    },
    enabled: !!user,
    staleTime: 1000 * 10, // 10 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch messages for selected user
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages', user?.id, selectedUserId],
    queryFn: async () => {
      if (!user || !selectedUserId) return [];

      // Handle demo users
      if (selectedUserId.startsWith('demo-')) {
        const demoMsgs = demoMessages[selectedUserId] || [];
        return demoMsgs.map(dm => ({
          id: dm.id,
          sender_id: dm.isOwn ? user.id : dm.senderId,
          receiver_id: dm.isOwn ? dm.receiverId : user.id,
          content: dm.content,
          read_at: new Date().toISOString(),
          created_at: dm.createdAt,
        }));
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      // Mark messages as read (fire and forget)
      supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', selectedUserId)
        .eq('receiver_id', user.id)
        .is('read_at', null)
        .then();

      return data as ChatMessage[];
    },
    enabled: !!user && !!selectedUserId,
    staleTime: 1000 * 5, // 5 seconds
  });

  // Send message mutation with optimistic update
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Handle demo users
      if (receiverId.startsWith('demo-')) {
        const newMsg: DemoChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: user.id,
          receiverId: receiverId,
          content,
          createdAt: new Date().toISOString(),
          isOwn: true,
        };
        
        setDemoMessages(prev => ({
          ...prev,
          [receiverId]: [...(prev[receiverId] || []), newMsg],
        }));
        
        return {
          id: newMsg.id,
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          read_at: null,
          created_at: newMsg.createdAt,
        };
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ receiverId, content }) => {
      // Optimistic update for messages
      await queryClient.cancelQueries({ queryKey: ['chat-messages', user?.id, receiverId] });
      
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        sender_id: user!.id,
        receiver_id: receiverId,
        content,
        read_at: null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ['chat-messages', user?.id, receiverId],
        (old: ChatMessage[] = []) => [...old, optimisticMessage]
      );

      return { optimisticMessage };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-threads', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to send message');
      // Rollback will happen via invalidation
      queryClient.invalidateQueries({ queryKey: ['chat-messages', user?.id, selectedUserId] });
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-threads', user.id] });
          if (selectedUserId) {
            queryClient.invalidateQueries({ queryKey: ['chat-messages', user.id, selectedUserId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId, queryClient]);

  const sendMessage = useCallback(async (receiverId: string, content: string) => {
    try {
      const data = await sendMessageMutation.mutateAsync({ receiverId, content });
      return { data, error: null };
    } catch (error) {
      return { error };
    }
  }, [sendMessageMutation]);

  const fetchMessages = useCallback((partnerId: string) => {
    refetchMessages();
  }, [refetchMessages]);

  return {
    threads,
    messages,
    loading,
    sendMessage,
    fetchMessages,
    refetchThreads,
  };
}
