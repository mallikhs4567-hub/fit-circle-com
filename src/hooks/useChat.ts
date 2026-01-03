import { useState, useEffect } from 'react';
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
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMessages, setDemoMessages] = useState<Record<string, DemoChatMessage[]>>({ ...demoChatMessagesMap });

  const fetchThreads = async () => {
    if (!user) {
      setThreads([]);
      setLoading(false);
      return;
    }

    // Get all messages involving the user
    const { data: messagesData, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      return;
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

    // Fetch profiles for all partners
    const partnerIds = Array.from(threadMap.keys());
    
    // If no real threads, use demo threads
    if (partnerIds.length === 0) {
      const demoThreadsFormatted: ChatThread[] = demoChatThreads.map(dt => ({
        participantId: dt.participantId,
        participantName: dt.participantName,
        participantAvatar: dt.participantAvatar,
        lastMessage: dt.lastMessage,
        lastMessageAt: dt.lastMessageTime,
        unreadCount: dt.unreadCount,
      }));
      setThreads(demoThreadsFormatted);
      setLoading(false);
      return;
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

    setThreads(threadList);
    setLoading(false);
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;

    // Handle demo users
    if (partnerId.startsWith('demo-')) {
      const demoMsgs = demoMessages[partnerId] || [];
      const formattedMessages: ChatMessage[] = demoMsgs.map(dm => ({
        id: dm.id,
        sender_id: dm.isOwn ? user.id : dm.senderId,
        receiver_id: dm.isOwn ? dm.receiverId : user.id,
        content: dm.content,
        read_at: new Date().toISOString(),
        created_at: dm.createdAt,
      }));
      setMessages(formattedMessages);
      return;
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data as ChatMessage[]);

    // Mark messages as read
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', partnerId)
      .eq('receiver_id', user.id)
      .is('read_at', null);
  };

  useEffect(() => {
    fetchThreads();

    // Subscribe to realtime updates
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
          fetchThreads();
          if (selectedUserId) {
            fetchMessages(selectedUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
    }
  }, [selectedUserId, user]);

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Handle demo users - add to local state only
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
      
      // Add to current messages
      const formattedMsg: ChatMessage = {
        id: newMsg.id,
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        read_at: null,
        created_at: newMsg.createdAt,
      };
      setMessages(prev => [...prev, formattedMsg]);
      
      return { data: formattedMsg, error: null };
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

    if (error) {
      toast.error('Failed to send message');
      return { error };
    }

    return { data, error: null };
  };

  return {
    threads,
    messages,
    loading,
    sendMessage,
    fetchMessages,
    refetchThreads: fetchThreads,
  };
}
