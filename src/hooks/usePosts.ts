import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  reactions: { heart: number; fire: number; clap: number };
  created_at: string;
  expires_at: string;
  username?: string;
  avatar_url?: string;
  userReaction?: 'heart' | 'fire' | 'clap';
}

export function usePosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Fetch posts that haven't expired, with profile info
    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(username, avatar_url)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
      return;
    }

    // Fetch user's reactions
    const { data: reactionsData } = await supabase
      .from('post_reactions')
      .select('post_id, reaction_type')
      .eq('user_id', user.id);

    const userReactions = new Map(
      reactionsData?.map(r => [r.post_id, r.reaction_type as 'heart' | 'fire' | 'clap']) || []
    );

    const formattedPosts: Post[] = (postsData || []).map((post: any) => ({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      image_url: post.image_url,
      reactions: post.reactions || { heart: 0, fire: 0, clap: 0 },
      created_at: post.created_at,
      expires_at: post.expires_at,
      username: post.profiles?.username || 'unknown',
      avatar_url: post.profiles?.avatar_url,
      userReaction: userReactions.get(post.id),
    }));

    setPosts(formattedPosts);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createPost = async (content: string, imageUrl?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create post');
      return { error };
    }

    toast.success('Posted to your Circle!');
    return { data, error: null };
  };

  const addReaction = async (postId: string, reactionType: 'heart' | 'fire' | 'clap') => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const hasReaction = post.userReaction === reactionType;

    if (hasReaction) {
      // Remove reaction
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);

      // Update post reactions count
      const newReactions = { ...post.reactions };
      newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);

      await supabase
        .from('posts')
        .update({ reactions: newReactions })
        .eq('id', postId);
    } else {
      // Remove any existing reaction first
      if (post.userReaction) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        const oldReactions = { ...post.reactions };
        oldReactions[post.userReaction] = Math.max(0, oldReactions[post.userReaction] - 1);
        
        await supabase
          .from('posts')
          .update({ reactions: oldReactions })
          .eq('id', postId);
      }

      // Add new reaction
      await supabase
        .from('post_reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        });

      // Update post reactions count
      const newReactions = { ...post.reactions };
      if (post.userReaction) {
        newReactions[post.userReaction] = Math.max(0, newReactions[post.userReaction] - 1);
      }
      newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;

      await supabase
        .from('posts')
        .update({ reactions: newReactions })
        .eq('id', postId);
    }

    // Optimistic update
    setPosts(posts.map(p => {
      if (p.id === postId) {
        const newReactions = { ...p.reactions };
        if (hasReaction) {
          newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
        } else {
          if (p.userReaction) {
            newReactions[p.userReaction] = Math.max(0, newReactions[p.userReaction] - 1);
          }
          newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
        }
        return {
          ...p,
          reactions: newReactions,
          userReaction: hasReaction ? undefined : reactionType,
        };
      }
      return p;
    }));
  };

  return {
    posts,
    loading,
    createPost,
    addReaction,
    refetch: fetchPosts,
  };
}
