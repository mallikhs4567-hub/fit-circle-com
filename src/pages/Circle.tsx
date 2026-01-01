import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Avatar } from '@/components/common/Avatar';
import { TimeLeft } from '@/components/common/TimeLeft';
import { Button } from '@/components/ui/button';
import { Plus, Heart, Flame, Hand, Send, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CirclePost } from '@/types';

export default function Circle() {
  const { posts, setPosts, user } = useApp();
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState('');

  const handleReaction = (postId: string, reaction: 'heart' | 'fire' | 'clap') => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const wasReacted = post.userReaction === reaction;
        return {
          ...post,
          userReaction: wasReacted ? undefined : reaction,
          reactions: {
            ...post.reactions,
            [reaction]: wasReacted ? post.reactions[reaction] - 1 : post.reactions[reaction] + 1,
          },
        };
      }
      return post;
    }));
  };

  const handlePost = () => {
    if (!newPost.trim() || !user) return;

    const post: CirclePost = {
      id: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      content: newPost,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      reactions: { heart: 0, fire: 0, clap: 0 },
    };

    setPosts([post, ...posts]);
    setNewPost('');
    setShowCompose(false);
  };

  const getTimeAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
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

      {/* Feed */}
      <div className="p-4 space-y-4">
        {posts.length === 0 ? (
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
                  <Avatar name={post.username} size="md" />
                  <div>
                    <p className="font-semibold text-foreground">@{post.username}</p>
                    <p className="text-xs text-muted-foreground">{getTimeAgo(post.createdAt)}</p>
                  </div>
                </div>
                <TimeLeft expiresAt={new Date(post.expiresAt)} />
              </div>

              {/* Content */}
              <p className="text-foreground text-base leading-relaxed mb-4">
                {post.content}
              </p>

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
                disabled={!newPost.trim()}
              >
                <Send className="w-4 h-4" />
                Post
              </Button>
            </div>

            {/* Compose Area */}
            <div className="flex-1 p-4">
              <div className="flex gap-3">
                <Avatar name={user?.username} size="md" />
                <textarea
                  autoFocus
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your progress..."
                  className="flex-1 bg-transparent text-foreground text-lg placeholder:text-muted-foreground resize-none focus:outline-none"
                  rows={5}
                  maxLength={280}
                />
              </div>
            </div>

            {/* Compose Footer */}
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
                <Image className="w-5 h-5" />
              </button>
              <span className="text-xs text-muted-foreground">
                {newPost.length}/280
              </span>
            </div>
          </div>
        </div>
      )}
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
