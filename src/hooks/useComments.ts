import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
  avatar_url?: string | null;
}

export function useComments(postId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId || postId.startsWith('demo-')) return;
    setLoading(true);

    // Fetch comments
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Fetch profiles for commenters
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', userIds)
        : { data: [] };
      
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    if (!error && data) {
      const mapped: Comment[] = data.map((c: any) => ({
        id: c.id,
        post_id: c.post_id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        username: c.profiles?.username,
        avatar_url: c.profiles?.avatar_url,
      }));
      setComments(mapped);
      setCount(mapped.length);
    }
    setLoading(false);
  }, [postId]);

  // Fetch count only (lightweight)
  const fetchCount = useCallback(async () => {
    if (!postId || postId.startsWith('demo-')) return;
    const { count: c, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    if (!error && c !== null) setCount(c);
  }, [postId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Realtime subscription
  useEffect(() => {
    if (!postId || postId.startsWith('demo-')) return;

    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId, fetchComments]);

  const addComment = async (content: string) => {
    if (!user || !content.trim() || postId.startsWith('demo-')) return null;

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, content: content.trim() })
      .select()
      .single();

    if (error) return null;

    // Optimistic: refetch
    await fetchComments();
    return data;
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;
    await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id);
    await fetchComments();
  };

  return { comments, count, loading, fetchComments, addComment, deleteComment };
}
