import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { Avatar } from '@/components/common/Avatar';
import { StreakBadge } from '@/components/common/StreakBadge';
import { GoalBadge } from '@/components/common/GoalBadge';
import { LevelIndicator } from '@/components/common/LevelIndicator';
import { XPProgressBar } from '@/components/common/XPProgressBar';
import { PostCard } from '@/components/circle/PostCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, UserPlus, Loader2, Flame, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PublicProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  streak: number;
  goal: string | null;
  xp: number;
  total_active_days: number;
  created_at: string;
}

interface UserPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  reactions: { heart: number; fire: number; clap: number };
  created_at: string;
  expires_at: string | null;
  view_count: number;
  like_count: number;
  type: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, sendFriendRequest, sentRequests, pendingRequests } = useFriends();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);

  const isOwnProfile = user?.id === userId;
  const isFriend = friends.some(f => f.user_id === userId);
  const hasSentRequest = sentRequests.some(r => r.user_id === userId);
  const hasPendingRequest = pendingRequests.some(r => r.user_id === userId);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);

      const [profileRes, postsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, username, avatar_url, bio, streak, goal, xp, total_active_days, created_at')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
          .order('created_at', { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data as PublicProfile);
      if (postsRes.data) setPosts(postsRes.data as UserPost[]);
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const handleAddFriend = async () => {
    if (!profile) return;
    setAddingFriend(true);
    await sendFriendRequest(profile.username);
    setAddingFriend(false);
  };

  const handleMessage = () => {
    if (!userId) return;
    navigate('/chat', { state: { selectedUserId: userId } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-2 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-foreground">@{profile.username}</span>
      </header>

      {/* Profile Info — public only */}
      <div className="px-4 py-6 text-center border-b border-border">
        <Avatar
          name={profile.username}
          src={profile.avatar_url}
          size="xl"
          showBorder
          className="mx-auto mb-4"
        />

        <LevelIndicator xp={profile.xp ?? 0} className="mb-2" />
        <XPProgressBar xp={profile.xp ?? 0} className="mx-auto mb-3" />

        <div className="flex items-center justify-center gap-1.5 mb-1">
          <h2 className="text-xl font-display font-bold text-foreground">
            @{profile.username}
          </h2>
          {profile.streak > 0 && (
            <Flame className="w-4 h-4 fill-streak text-streak" />
          )}
        </div>

        {profile.goal && <GoalBadge goal={profile.goal} size="md" className="mb-2" />}

        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-3 max-w-xs mx-auto">{profile.bio}</p>
        )}

        {/* Streak */}
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-streak/10 border border-streak/20 mb-4">
          <StreakBadge streak={profile.streak} size="md" animate={profile.streak > 0} />
        </div>

        {/* Stats row — public only */}
        <div className="flex items-center justify-center gap-6 text-center mt-2">
          <div>
            <p className="text-lg font-display font-bold text-foreground">{profile.streak}</p>
            <p className="text-[10px] text-muted-foreground">Streak</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-lg font-display font-bold text-foreground">{profile.total_active_days}</p>
            <p className="text-[10px] text-muted-foreground">Active Days</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-lg font-display font-bold text-foreground">{posts.length}</p>
            <p className="text-[10px] text-muted-foreground">Posts</p>
          </div>
        </div>

        {/* Actions */}
        {!isOwnProfile && (
          <div className="flex gap-3 justify-center mt-5">
            {isFriend ? (
              <Button onClick={handleMessage} size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            ) : hasSentRequest ? (
              <Button variant="secondary" size="sm" disabled>
                <Check className="w-4 h-4 mr-2" />
                Request Sent
              </Button>
            ) : hasPendingRequest ? (
              <Button variant="secondary" size="sm" disabled>
                Request Pending
              </Button>
            ) : (
              <Button onClick={handleAddFriend} size="sm" disabled={addingFriend}>
                {addingFriend ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Add Friend
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Posts
        </h3>
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No posts yet</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  ...post,
                  username: profile.username,
                  avatar_url: profile.avatar_url || undefined,
                  reactions: post.reactions || { heart: 0, fire: 0, clap: 0 },
                  expires_at: post.expires_at || new Date(Date.now() + 86400000).toISOString(),
                  type: post.type as 'story' | 'post',
                }}
                onReaction={() => {}}
                isStory={post.type === 'story' || !post.type}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
