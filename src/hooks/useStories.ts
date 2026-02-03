import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { demoPosts, demoFriends } from '@/lib/demoData';

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

export function useStories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      if (!user) {
        return { stories: getDemoStories(), myStory: null };
      }

      // Fetch current user's profile
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single();

      // Fetch current user's active posts (stories)
      const { data: myPosts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      let myStory: Story | null = null;
      if (myPosts && myPosts.length > 0 && myProfile) {
        myStory = {
          userId: user.id,
          username: myProfile.username,
          avatarUrl: myProfile.avatar_url,
          posts: myPosts.map(post => ({
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            image_url: post.image_url,
            created_at: post.created_at,
            expires_at: post.expires_at,
            username: myProfile.username,
            avatar_url: myProfile.avatar_url,
          })),
          hasUnviewed: false,
        };
      }

      // First, get friends list
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendError) {
        console.error('Error fetching friends for stories:', friendError);
        return { stories: getDemoStories(), myStory };
      }

      // Get friend user IDs
      const friendIds = friendships?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      if (friendIds.length === 0) {
        return { stories: getDemoStories(), myStory };
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
        return { stories: getDemoStories(), myStory };
      }

      if (!postsData || postsData.length === 0) {
        return { stories: getDemoStories(), myStory };
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
            hasUnviewed: true,
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

      return { stories: Array.from(userMap.values()), myStory };
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  return { 
    stories: data?.stories ?? [], 
    myStory: data?.myStory ?? null, 
    loading, 
    refetch 
  };
}
