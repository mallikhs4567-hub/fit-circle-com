import { useState, useRef } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/common/Avatar';
import { TimeLeft } from '@/components/common/TimeLeft';
import { Button } from '@/components/ui/button';
import { MediaPreview } from '@/components/circle/MediaPreview';
import { PostMedia } from '@/components/circle/PostMedia';
import { StoriesRow } from '@/components/profile/StoriesRow';
import { MediaPermissionDialog } from '@/components/circle/MediaPermissionDialog';
import { Plus, Heart, Flame, Hand, Send, X, Image, Video, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Circle() {
  const { posts, loading, createPost, addReaction } = usePosts();
  const { profile } = useProfile();
  const [showCompose, setShowCompose] = useState(false);
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

  const handlePost = async () => {
    if (!newPost.trim() && !mediaFile) return;
    
    setPosting(true);
    await createPost(newPost.trim(), mediaFile || undefined);
    setPosting(false);
    setNewPost('');
    setMediaFile(null);
    setShowCompose(false);
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-display font-bold text-foreground">Circle</h1>
          <Button
            variant="default"
            size="icon-sm"
            onClick={() => setShowCompose(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Stories Row */}
      <StoriesRow />

      {/* Feed */}
      <div className="px-4 pb-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Flame className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No posts yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to share your progress!
            </p>
          </div>
        ) : (
          posts.map((post, index) => (
            <article
              key={post.id}
              className="card-elevated p-4 animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar name={post.username} src={post.avatar_url} size="md" />
                  <div>
                    <p className="font-semibold text-foreground">@{post.username}</p>
                    <p className="text-xs text-muted-foreground">{getTimeAgo(post.created_at)}</p>
                  </div>
                </div>
                <TimeLeft expiresAt={new Date(post.expires_at)} />
              </div>

              {/* Content */}
              <p className="text-foreground text-base leading-relaxed">
                {post.content}
              </p>

              {/* Media */}
              {post.image_url && (
                <PostMedia url={post.image_url} />
              )}

              <div className="mt-4" />

              {/* Reactions */}
              <div className="flex items-center gap-2">
                <ReactionButton
                  icon={Heart}
                  count={post.reactions.heart}
                  active={post.userReaction === 'heart'}
                  onClick={() => handleReaction(post.id, 'heart')}
                  activeColor="text-pink-500"
                />
                <ReactionButton
                  icon={Flame}
                  count={post.reactions.fire}
                  active={post.userReaction === 'fire'}
                  onClick={() => handleReaction(post.id, 'fire')}
                  activeColor="text-streak"
                />
                <ReactionButton
                  icon={Hand}
                  count={post.reactions.clap}
                  active={post.userReaction === 'clap'}
                  onClick={() => handleReaction(post.id, 'clap')}
                  activeColor="text-primary"
                />
              </div>
            </article>
          ))
        )}
      </div>

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
              <h2 className="font-semibold text-foreground">New Post</h2>
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
                    Post
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
                    rows={4}
                    maxLength={280}
                  />
                  {mediaFile && (
                    <div className="mt-3">
                      <MediaPreview
                        file={mediaFile}
                        onRemove={() => setMediaFile(null)}
                      />
                    </div>
                  )}
                </div>
              </div>
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
    </div>
  );
}

function ReactionButton({
  icon: Icon,
  count,
  active,
  onClick,
  activeColor,
}: {
  icon: typeof Heart;
  count: number;
  active: boolean;
  onClick: () => void;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200",
        active
          ? `${activeColor} bg-current/10`
          : "text-muted-foreground hover:bg-secondary"
      )}
    >
      <Icon className={cn("w-4 h-4", active && "fill-current")} />
      <span className="text-sm font-medium">{count > 0 ? count : ''}</span>
    </button>
  );
}
