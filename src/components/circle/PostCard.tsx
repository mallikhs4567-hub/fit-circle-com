 import { useState } from 'react';
 import { Avatar } from '@/components/common/Avatar';
 import { TimeLeft } from '@/components/common/TimeLeft';
 import { GoalBadge } from '@/components/common/GoalBadge';
 import { LevelIndicator } from '@/components/common/LevelIndicator';
 import { PostMedia } from './PostMedia';
 import { CommentSection } from './CommentSection';
 import { Button } from '@/components/ui/button';
 import { 
   Heart, Flame, Hand, MoreVertical, Share2, Trash2, Eye, ThumbsUp 
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Post } from '@/hooks/usePosts';
 import { useAuth } from '@/hooks/useAuth';
 import { usePostLikes } from '@/hooks/usePostLikes';
 import { usePostViews } from '@/hooks/usePostViews';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { toast } from 'sonner';
 import { supabase } from '@/integrations/supabase/client';
 import { useQueryClient } from '@tanstack/react-query';
 import { useEffect } from 'react';
 
 interface PostCardProps {
   post: Post;
   onReaction: (postId: string, type: 'heart' | 'fire' | 'clap') => void;
   isStory?: boolean;
 }
 
 export function PostCard({ post, onReaction, isStory = true }: PostCardProps) {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   const { isLiked, toggleLike } = usePostLikes(post.id);
   const { recordView } = usePostViews();
   
   const isOwner = post.user_id === user?.id;
 
   // Record view when post is visible
   useEffect(() => {
     if (!post.id.startsWith('demo-') && user) {
       recordView(post.id);
     }
   }, [post.id, user]);
 
   const getTimeAgo = (dateStr: string) => {
     const diff = Date.now() - new Date(dateStr).getTime();
     const hours = Math.floor(diff / (1000 * 60 * 60));
     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
     
     if (hours > 0) return `${hours}h ago`;
     if (minutes > 0) return `${minutes}m ago`;
     return 'Just now';
   };
 
   const handleShare = () => {
     if (navigator.share) {
       navigator.share({
         title: `${post.username}'s post`,
         text: post.content,
       }).catch(() => {});
     } else {
       toast.success('Link copied!');
     }
   };
 
   const handleDelete = async () => {
     if (!user || post.id.startsWith('demo-')) return;
     
     const { error } = await supabase
       .from('posts')
       .delete()
       .eq('id', post.id)
       .eq('user_id', user.id);
     
     if (error) {
       toast.error('Failed to delete post');
     } else {
       toast.success('Post deleted');
       queryClient.invalidateQueries({ queryKey: ['posts'] });
       queryClient.invalidateQueries({ queryKey: ['stories'] });
     }
   };
 
   return (
     <article className="card-elevated p-4 animate-fade-up">
       {/* Header */}
       <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
            <Avatar name={post.username} src={post.avatar_url} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-foreground">@{post.username}</p>
                {(post as any).streak > 0 && (
                  <Flame className="w-3.5 h-3.5 fill-streak text-streak" />
                )}
                <LevelIndicator xp={(post as any).xp ?? 0} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">{getTimeAgo(post.created_at)}</p>
                {(post as any).goal && <GoalBadge goal={(post as any).goal} size="sm" />}
              </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
           {isStory && post.expires_at && (
             <TimeLeft expiresAt={new Date(post.expires_at)} />
           )}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon-sm">
                 <MoreVertical className="w-4 h-4" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={handleShare}>
                 <Share2 className="w-4 h-4 mr-2" />
                 Share
               </DropdownMenuItem>
               {isOwner && (
                 <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                   <Trash2 className="w-4 h-4 mr-2" />
                   Delete
                 </DropdownMenuItem>
               )}
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
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
 
       {/* Stats and Actions */}
       <div className="flex items-center justify-between">
         {/* Reactions for stories */}
         {isStory ? (
           <div className="flex items-center gap-2">
             <ReactionButton
               icon={Heart}
               count={post.reactions.heart}
               active={post.userReaction === 'heart'}
               onClick={() => onReaction(post.id, 'heart')}
               activeColor="text-pink-500"
             />
             <ReactionButton
               icon={Flame}
               count={post.reactions.fire}
               active={post.userReaction === 'fire'}
               onClick={() => onReaction(post.id, 'fire')}
               activeColor="text-streak"
             />
             <ReactionButton
               icon={Hand}
               count={post.reactions.clap}
               active={post.userReaction === 'clap'}
               onClick={() => onReaction(post.id, 'clap')}
               activeColor="text-primary"
             />
           </div>
         ) : (
           /* Like button for permanent posts */
           <button
             onClick={toggleLike}
             className={cn(
               "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200",
               isLiked
                 ? "text-pink-500 bg-pink-500/10"
                 : "text-muted-foreground hover:bg-secondary"
             )}
           >
             <ThumbsUp className={cn("w-4 h-4", isLiked && "fill-current")} />
             <span className="text-sm font-medium">
               {(post as any).like_count || 0}
             </span>
           </button>
         )}
 
         {/* View count */}
         <div className="flex items-center gap-1 text-muted-foreground text-xs">
           <Eye className="w-3.5 h-3.5" />
           <span>{(post as any).view_count || 0}</span>
         </div>
       </div>
     </article>
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