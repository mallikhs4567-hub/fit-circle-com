import { useState, useRef, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePosts } from '@/hooks/usePosts';
import { Avatar } from '@/components/common/Avatar';
import { StreakBadge } from '@/components/common/StreakBadge';
import { GoalBadge } from '@/components/common/GoalBadge';
import { LevelIndicator } from '@/components/common/LevelIndicator';
import { XPProgressBar } from '@/components/common/XPProgressBar';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PostCard } from '@/components/circle/PostCard';
import { PullToRefresh } from '@/components/common/PullToRefresh';
import { NotificationCenter } from '@/components/common/NotificationCenter';
import {
  Settings, 
  Trophy, 
  Target, 
  Calendar, 
  Flame,
  Loader2,
  Camera,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const goalLabels: Record<string, string> = {
  'weight-loss': 'Weight Loss',
  'muscle-gain': 'Muscle Gain',
  'healthy-routine': 'Healthy Routine',
  'yoga': 'Yoga',
  'runner': 'Runner',
  'general-fitness': 'General Fitness',
};

export default function Profile() {
  const { profile, loading, updateProfile, refetch: refetchProfile } = useProfile();
  const { signOut } = useAuth();
  const { isPremium } = useSubscription();
  const { posts, addReaction, refetch: refetchPosts } = usePosts();
  const navigate = useNavigate();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingAvatar(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Failed to upload avatar');
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('post-media')
      .getPublicUrl(fileName);

    await updateProfile({ avatar_url: urlData.publicUrl });
    toast.success('Profile picture updated!');
    setUploadingAvatar(false);
  };

  const handleSaveBio = async () => {
    await updateProfile({ bio: bioText });
    setIsEditingBio(false);
    toast.success('Bio updated!');
  };

  const startEditBio = () => {
    setBioText(profile?.bio || '');
    setIsEditingBio(true);
  };

  // Filter for user's own posts
  const myPosts = posts.filter(p => p.user_id === profile?.user_id);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchProfile(), refetchPosts()]);
  }, [refetchProfile, refetchPosts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-display font-bold text-foreground">Profile</h1>
          <div className="flex items-center gap-1">
            <NotificationCenter />
            <Button variant="ghost" size="icon-sm" onClick={() => navigate('/settings')}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <PullToRefresh onRefresh={handleRefresh}>

      {/* Profile Card */}
      <div className="px-4 mb-6">
        <div className="card-elevated p-6 text-center">
          <div className="relative inline-block mb-4">
            <Avatar 
              name={profile.username} 
              src={profile.avatar_url} 
              size="xl" 
              showBorder 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background"
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <LevelIndicator xp={profile.xp ?? 0} className="mb-2" />
          <XPProgressBar xp={profile.xp ?? 0} className="mx-auto mb-2" />
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h2 className="text-xl font-display font-bold text-foreground">
              @{profile.username}
            </h2>
            {isPremium && <PremiumBadge size="md" />}
            {(profile.streak ?? 0) > 0 && (
              <Flame className="w-4 h-4 fill-streak text-streak" />
            )}
          </div>
          {profile.goal && <GoalBadge goal={profile.goal} size="md" className="mb-2" />}
          
          {/* Bio Section */}
          <div className="mb-4">
            {isEditingBio ? (
              <div className="space-y-2">
                <Textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="Write something about yourself..."
                  className="text-center"
                  maxLength={150}
                />
                <div className="flex justify-center gap-2">
                  <Button size="sm" onClick={handleSaveBio}>
                    <Check className="w-4 h-4" />
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingBio(false)}>
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {profile.bio || 'No bio yet'}
                </p>
                <button
                  onClick={startEditBio}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          
          {/* Streak Display */}
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-streak/10 border border-streak/20">
            <StreakBadge streak={profile.streak ?? 0} size="md" animate={(profile.streak ?? 0) > 0} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={`${profile.streak} days`}
            iconColor="text-streak"
          />
          <StatCard
            icon={Trophy}
            label="Total Active"
            value={`${profile.total_active_days} days`}
            iconColor="text-primary"
          />
          <StatCard
            icon={Calendar}
            label="Member Since"
            value={new Date(profile.created_at).toLocaleDateString(undefined, { 
              month: 'short', 
              year: 'numeric' 
            })}
            iconColor="text-muted-foreground"
          />
          <StatCard
            icon={Target}
            label="Goal"
            value={profile.goal ? goalLabels[profile.goal] : 'Not set'}
            iconColor="text-success"
          />
        </div>
      </div>

      {/* My Posts Section */}
      <div className="px-4 mb-6">
        <h3 className="section-header mb-3">My Posts</h3>
        {myPosts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No posts yet
          </p>
        ) : (
          <div className="space-y-4">
            {myPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReaction={addReaction}
                isStory={post.type === 'story'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile */}
      <div className="px-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/settings')}
        >
          <Settings className="w-5 h-5" />
          Edit Profile
        </Button>
      </div>
      </PullToRefresh>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  iconColor: string;
}) {
  return (
    <div className="card-elevated p-4 space-y-2">
      <div className={`flex items-center gap-2 ${iconColor}`}>
        <Icon className="w-4 h-4" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="stat-value text-lg text-foreground">{value}</p>
    </div>
  );
}
