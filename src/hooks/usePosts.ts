import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { demoPosts, DemoPost } from '@/lib/demoData';

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
  type?: 'story' | 'post';
  view_count?: number;
  like_count?: number;
}

export type MediaType = 'image' | 'video' | null;

export function usePosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoReactions, setDemoReactions] = useState<Record<string, 'heart' | 'fire' | 'clap' | null>>({});

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
        profiles!posts_user_id_profiles_fkey(username, avatar_url, goal, streak)
      `)
      .or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`)
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
      expires_at: post.expires_at || new Date(Date.now() + 86400000).toISOString(),
      username: post.profiles?.username || 'unknown',
      avatar_url: post.profiles?.avatar_url,
      userReaction: userReactions.get(post.id),
      type: post.type || 'story',
      view_count: post.view_count || 0,
      like_count: post.like_count || 0,
      goal: post.profiles?.goal,
      streak: post.profiles?.streak || 0,
    }));

    // If no real posts, merge with demo posts for showcase
    if (formattedPosts.length === 0) {
      const demoPostsFormatted: Post[] = demoPosts.map(dp => ({
        ...dp,
        userReaction: demoReactions[dp.id] || dp.userReaction || undefined,
      }));
      setPosts(demoPostsFormatted);
    } else {
      setPosts(formattedPosts);
    }
    
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

  const uploadMedia = async (file: File): Promise<{ url: string; type: MediaType } | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const isVideo = file.type.startsWith('video/');

    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error('Failed to upload media');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('post-media')
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      type: isVideo ? 'video' : 'image',
    };
  };

  const createPost = async (content: string, mediaFile?: File, type: 'story' | 'post' = 'story') => {
    if (!user) return { error: new Error('Not authenticated') };

    let mediaUrl: string | null = null;

    if (mediaFile) {
      const result = await uploadMedia(mediaFile);
      if (!result) return { error: new Error('Media upload failed') };
      mediaUrl = result.url;
    }

    const insertData: any = {
      user_id: user.id,
      content,
      image_url: mediaUrl,
      type,
    };

    // Only set expires_at to null for permanent posts
    if (type === 'post') {
      insertData.expires_at = null;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast.error('Failed to create post');
      return { error };
    }

    toast.success(type === 'story' ? 'Story posted!' : 'Post created!');
    // Refetch posts to show the new post immediately
    await fetchPosts();
    return { data, error: null, xpAction: 'post_created' as const };
  };

  const addReaction = async (postId: string, reactionType: 'heart' | 'fire' | 'clap') => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Handle demo posts (client-side only)
    if (postId.startsWith('demo-')) {
      const hasReaction = demoReactions[postId] === reactionType;
      setDemoReactions(prev => ({
        ...prev,
        [postId]: hasReaction ? null : reactionType,
      }));
      
      // Optimistic update for demo posts
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const newReactions = { ...p.reactions };
          const currentReaction = demoReactions[postId];
          
          if (hasReaction) {
            newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
          } else {
            if (currentReaction) {
              newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
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
      return;
    }

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
    uploadMedia,
    refetch: fetchPosts,
  };
}
