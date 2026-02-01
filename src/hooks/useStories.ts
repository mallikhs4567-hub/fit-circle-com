import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { demoPosts, demoFriends, DemoPost } from '@/lib/demoData';

export interface Story {
  userId: string;
  username: string;
  avatarUrl: string | null;
  posts: StoryPost[];
  hasUnviewed: boolean;
}

export interface StoryPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  expires_at: string;
  username: string;
  avatar_url: string | null;
}

export function useStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      if (!user) {
        // Show demo stories when not logged in
        setStories(getDemoStories());
        setLoading(false);
        return;
      }

      // First, get friends list
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendError) {
        console.error('Error fetching friends for stories:', friendError);
        setStories(getDemoStories());
        setLoading(false);
        return;
      }

      // Get friend user IDs
      const friendIds = friendships?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      if (friendIds.length === 0) {
        // No friends, show demo stories
        setStories(getDemoStories());
        setLoading(false);
        return;
      }

      // Fetch posts only from friends (not expired)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_profiles_fkey(username, avatar_url)
        `)
        .in('user_id', friendIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching stories:', postsError);
        setStories(getDemoStories());
        setLoading(false);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setStories(getDemoStories());
        setLoading(false);
        return;
      }

      // Group posts by user to create stories
      const userMap = new Map<string, Story>();
      
      postsData.forEach((post: any) => {
        if (!userMap.has(post.user_id)) {
          userMap.set(post.user_id, {
            userId: post.user_id,
            username: post.profiles?.username || 'unknown',
            avatarUrl: post.profiles?.avatar_url || null,
            posts: [],
            hasUnviewed: true, // Mark as unviewed for now
          });
        }
        userMap.get(post.user_id)!.posts.push({
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          expires_at: post.expires_at,
          username: post.profiles?.username || 'unknown',
          avatar_url: post.profiles?.avatar_url || null,
        });
      });

      setStories(Array.from(userMap.values()));
      setLoading(false);
    };

    fetchStories();
  }, [user]);

  return { stories, loading };
}

// Helper function to create demo stories from demo data
function getDemoStories(): Story[] {
  const userMap = new Map<string, Story>();
  
  demoPosts.forEach((post) => {
    if (!userMap.has(post.user_id)) {
      const friend = demoFriends.find(f => f.user_id === post.user_id);
      userMap.set(post.user_id, {
        userId: post.user_id,
        username: post.username,
        avatarUrl: friend?.avatar_url || null,
        posts: [],
        hasUnviewed: Math.random() > 0.3,
      });
    }
    userMap.get(post.user_id)!.posts.push({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at,
      expires_at: post.expires_at,
      username: post.username,
      avatar_url: null,
    });
  });
  
  return Array.from(userMap.values());
}
