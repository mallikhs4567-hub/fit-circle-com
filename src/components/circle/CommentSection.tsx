import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComments, Comment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { useXP } from '@/hooks/useXP';
import { LevelUpModal } from '@/components/common/LevelUpModal';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  postId: string;
  isDemo?: boolean;
}

export function CommentSection({ postId, isDemo }: CommentSectionProps) {
  const { user } = useAuth();
  const { comments, count, loading, fetchComments, addComment, deleteComment } = useComments(postId);
  const { awardXP } = useXP();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

  const handleExpand = () => {
    if (!expanded) {
      fetchComments();
      setExpanded(true);
    } else {
      setExpanded(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || submitting || isDemo) return;
    setSubmitting(true);
    const result = await addComment(text.trim());
    if (result) {
      setText('');
      const xpResult = await awardXP('comment');
      if (xpResult?.leveledUp) setLevelUpLevel(xpResult.newLevel);
    }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  };

  return (
    <div className="mt-2">
      <LevelUpModal
        open={levelUpLevel !== null}
        level={levelUpLevel ?? 1}
        onClose={() => setLevelUpLevel(null)}
      />

      {/* Toggle button */}
      <button
        onClick={handleExpand}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{count > 0 ? `${count} comment${count !== 1 ? 's' : ''}` : 'Comment'}</span>
      </button>

      {/* Expanded comments */}
      {expanded && (
        <div className="mt-3 space-y-3 animate-fade-up">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No comments yet. Be the first!</p>
              )}
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isOwner={comment.user_id === user?.id}
                  onDelete={() => deleteComment(comment.id)}
                  timeAgo={getTimeAgo(comment.created_at)}
                />
              ))}
            </>
          )}

          {/* Input */}
          {user && !isDemo && (
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a comment..."
                maxLength={280}
                className="flex-1 h-9 text-sm"
              />
              <Button
                size="icon-sm"
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  isOwner,
  onDelete,
  timeAgo,
}: {
  comment: Comment;
  isOwner: boolean;
  onDelete: () => void;
  timeAgo: string;
}) {
  return (
    <div className="flex gap-2 group">
      <Avatar name={comment.username} src={comment.avatar_url} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">@{comment.username}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          {isOwner && (
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-sm text-foreground/90 leading-snug break-words">{comment.content}</p>
      </div>
    </div>
  );
}
