import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '@/hooks/usePosts';
import { useProfile } from '@/hooks/useProfile';
import { useStories } from '@/hooks/useStories';
import { useXP } from '@/hooks/useXP';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { MediaPreview } from '@/components/circle/MediaPreview';
import { StoriesRow } from '@/components/profile/StoriesRow';
import { MediaPermissionDialog } from '@/components/circle/MediaPermissionDialog';
import { PostTypeDialog } from '@/components/circle/PostTypeDialog';
import { PostCard } from '@/components/circle/PostCard';
import { PullToRefresh } from '@/components/common/PullToRefresh';
import { NotificationCenter } from '@/components/common/NotificationCenter';
import { LevelUpModal } from '@/components/common/LevelUpModal';
import { AdBanner } from '@/components/common/AdBanner';
import { Plus, Send, X, Image, Video, Loader2, Flame, Search } from 'lucide-react';

type ComposeMode = 'post' | 'story';

export default function Circle() {
  const { posts, loading, createPost, addReaction, refetch: refetchPosts } = usePosts();
  const { profile } = useProfile();
  const { myStory, refetch: refetchStories } = useStories();
  const { awardXP } = useXP();
  const [showCompose, setShowCompose] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [composeMode, setComposeMode] = useState<ComposeMode>('post');
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReaction = (postId: string, reaction: 'heart' | 'fire' | 'clap') => {
    addReaction(postId, reaction);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (50MB limit)
      if (file.size > 52428800) {
        return;
      }
      setMediaFile(file);
    }
  };

  const handleMediaButtonClick = () => {
    if (hasMediaPermission) {
      fileInputRef.current?.click();
    } else {
      setShowPermissionDialog(true);
    }
  };

  const handlePermissionGranted = () => {
    setHasMediaPermission(true);
    // Trigger file input after permission is granted
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handlePlusClick = () => {
    // If user has an active story, show choice dialog
    if (myStory) {
      setShowTypeDialog(true);
    } else {
      // No story, default to post
      setComposeMode('post');
      setShowCompose(true);
    }
  };

  const handleSelectPost = () => {
    setComposeMode('post');
    setShowCompose(true);
  };

  const handleSelectStory = () => {
    setComposeMode('story');
    setShowCompose(true);
  };

  const handleAddStory = () => {
    setComposeMode('story');
    setShowCompose(true);
  };

  const handlePost = async () => {
    if (!newPost.trim() && !mediaFile) return;
    
    setPosting(true);
    const result = await createPost(newPost.trim(), mediaFile || undefined, composeMode);
    setPosting(false);
    setNewPost('');
    setMediaFile(null);
    setShowCompose(false);
    
    // Award XP for creating a post
    if (result && !('error' in result && result.error)) {
      const xpResult = await awardXP('post_created');
      if (xpResult?.leveledUp) setLevelUpLevel(xpResult.newLevel);
    }
    
    // Refetch stories to update the UI
    refetchStories();
  };

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchPosts(), refetchStories()]);
  }, [refetchPosts, refetchStories]);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Filter posts by type
  const stories = posts.filter(p => (p as any).type === 'story' || !(p as any).type);
  const permanentPosts = posts.filter(p => (p as any).type === 'post');

  return (
    <div className="min-h-screen bg-background pb-20">
      <LevelUpModal
        open={levelUpLevel !== null}
        level={levelUpLevel ?? 1}
        onClose={() => setLevelUpLevel(null)}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-display font-bold text-foreground">Circle</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate('/search')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="w-5 h-5" />
            </Button>
            <NotificationCenter />
            <Button
              variant="default"
              size="icon-sm"
              onClick={handlePlusClick}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        {/* Stories Row */}
        <StoriesRow onAddStory={handleAddStory} />

        {/* Feed */}
        <div className="px-4 pb-4 space-y-3">
          <h3 className="section-header pt-1">Feed</h3>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <Flame className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1">No Posts Yet</h3>
              <p className="text-sm text-muted-foreground">
                Share your progress with your circle
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post, index) => (
                <div key={post.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <PostCard post={post} onReaction={handleReaction} isStory={(post as any).type === 'story' || !(post as any).type} />
                  {/* Show ad after every 3rd post */}
                  {(index + 1) % 3 === 0 && <AdBanner variant="inline" className="mt-3" />}
                </div>
              ))}
              {/* Final ad banner at the end */}
              <AdBanner variant="banner" />
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl animate-slide-in-bottom">
          <div className="flex flex-col h-full safe-top safe-bottom">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button
                onClick={() => setShowCompose(false)}
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="font-semibold text-foreground">
                {composeMode === 'story' ? 'New Story' : 'New Post'}
              </h2>
              <Button
                size="sm"
                onClick={handlePost}
                disabled={(!newPost.trim() && !mediaFile) || posting}
              >
                {posting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {composeMode === 'story' ? 'Share' : 'Post'}
                  </>
                )}
              </Button>
            </div>

            {/* Compose Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex gap-3">
                <Avatar name={profile?.username} src={profile?.avatar_url} size="md" />
                <div className="flex-1">
                  <textarea
                    autoFocus
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share your progress..."
                    className="w-full bg-transparent text-foreground text-lg placeholder:text-muted-foreground resize-none focus:outline-none"
                    rows={3}
                    maxLength={280}
                  />
                </div>
              </div>

              {/* Media Section */}
              {mediaFile ? (
                <div className="mt-4">
                  <MediaPreview
                    file={mediaFile}
                    onRemove={() => setMediaFile(null)}
                  />
                </div>
              ) : (
                <div className="mt-4">
                  <button
                    onClick={handleMediaButtonClick}
                    className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Image className="w-5 h-5 text-primary" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Video className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Add Photos or Videos</p>
                        <p className="text-xs text-muted-foreground mt-1">Share your workout, meals, or progress</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Compose Footer */}
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <div className="flex gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={handleMediaButtonClick}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
                >
                  <Image className="w-5 h-5" />
                </button>
                <button
                  onClick={handleMediaButtonClick}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
                >
                  <Video className="w-5 h-5" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                {newPost.length}/280
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Media Permission Dialog */}
      <MediaPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onAllow={handlePermissionGranted}
      />

      {/* Post Type Choice Dialog */}
      <PostTypeDialog
        open={showTypeDialog}
        onOpenChange={setShowTypeDialog}
        onSelectPost={handleSelectPost}
        onSelectStory={handleSelectStory}
      />
    </div>
  );
}
