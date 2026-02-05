 import { useState, useEffect } from 'react';
 import { Dialog, DialogContent } from '@/components/ui/dialog';
 import { Avatar } from '@/components/common/Avatar';
 import { PostMedia } from './PostMedia';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { 
   X, ChevronLeft, ChevronRight, Heart, Flame, Hand, 
   Send, MoreVertical, Share2, Trash2, Eye, Users 
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Story, StoryPost } from '@/hooks/useStories';
 import { useStoryInteractions } from '@/hooks/useStoryInteractions';
 import { useAuth } from '@/hooks/useAuth';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { toast } from 'sonner';
 
 interface StoryViewerProps {
   story: Story | null;
   allStories: Story[];
   currentPostIndex: number;
   onClose: () => void;
   onPrev: () => void;
   onNext: () => void;
   onPostIndexChange: (index: number) => void;
   onStoryChange: (story: Story) => void;
 }
 
 export function StoryViewer({
   story,
   allStories,
   currentPostIndex,
   onClose,
   onPrev,
   onNext,
   onPostIndexChange,
   onStoryChange,
 }: StoryViewerProps) {
   const { user } = useAuth();
   const [replyText, setReplyText] = useState('');
   const [showViewers, setShowViewers] = useState(false);
   
   const currentPost = story?.posts[currentPostIndex];
   const storyId = currentPost?.id || '';
   
   const {
     viewers,
     reactions,
     viewCount,
     recordView,
     addReaction,
     sendReply,
     deleteStory,
     userReaction,
   } = useStoryInteractions(storyId);
 
   const isOwnStory = story?.userId === user?.id;
 
   // Record view when story opens
   useEffect(() => {
     if (storyId && !isOwnStory) {
       recordView();
     }
   }, [storyId, isOwnStory]);
 
   const handleReply = () => {
     if (!replyText.trim() || !story) return;
     sendReply(story.userId, replyText.trim());
     setReplyText('');
   };
 
   const handleShare = () => {
     if (navigator.share && currentPost) {
       navigator.share({
         title: `${story?.username}'s story`,
         text: currentPost.content,
       }).catch(() => {});
     } else {
       toast.success('Link copied!');
     }
   };
 
   const handleDelete = () => {
     deleteStory();
     onClose();
   };
 
   const handlePrevNav = () => {
     if (currentPostIndex > 0) {
       onPostIndexChange(currentPostIndex - 1);
     } else {
       const currentIdx = allStories.findIndex(s => s.userId === story?.userId);
       if (currentIdx > 0) {
         const prevStory = allStories[currentIdx - 1];
         onStoryChange(prevStory);
         onPostIndexChange(prevStory.posts.length - 1);
       }
     }
   };
 
   const handleNextNav = () => {
     if (story && currentPostIndex < story.posts.length - 1) {
       onPostIndexChange(currentPostIndex + 1);
     } else {
       const currentIdx = allStories.findIndex(s => s.userId === story?.userId);
       if (currentIdx < allStories.length - 1) {
         onStoryChange(allStories[currentIdx + 1]);
         onPostIndexChange(0);
       } else {
         onClose();
       }
     }
   };
 
   if (!story || !currentPost) return null;
 
   return (
     <Dialog open={!!story} onOpenChange={() => onClose()}>
       <DialogContent className="max-w-md w-full h-[85vh] p-0 bg-black border-0 overflow-hidden">
         <div className="relative h-full flex flex-col">
           {/* Progress bars */}
           <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
             {story.posts.map((_, idx) => (
               <div
                 key={idx}
                 className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden"
               >
                 <div
                   className={cn(
                     "h-full bg-white transition-all duration-300",
                     idx <= currentPostIndex ? "w-full" : "w-0"
                   )}
                 />
               </div>
             ))}
           </div>
 
           {/* Header */}
           <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Avatar
                 name={story.username}
                 src={story.avatarUrl}
                 size="sm"
               />
               <div>
                 <p className="text-white text-sm font-medium">{story.username}</p>
                 <p className="text-white/60 text-xs">
                   {new Date(currentPost.created_at).toLocaleTimeString([], { 
                     hour: '2-digit', minute: '2-digit' 
                   })}
                 </p>
               </div>
             </div>
             <div className="flex items-center gap-2">
               {/* View count for own stories */}
               {isOwnStory && (
                 <button
                   onClick={() => setShowViewers(!showViewers)}
                   className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/30 text-white text-xs"
                 >
                   <Eye className="w-3 h-3" />
                   {viewCount}
                 </button>
               )}
               
               {/* 3-dot menu */}
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <button className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors">
                     <MoreVertical className="w-5 h-5" />
                   </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-40">
                   <DropdownMenuItem onClick={handleShare}>
                     <Share2 className="w-4 h-4 mr-2" />
                     Share
                   </DropdownMenuItem>
                   {isOwnStory && (
                     <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                       <Trash2 className="w-4 h-4 mr-2" />
                       Delete
                     </DropdownMenuItem>
                   )}
                 </DropdownMenuContent>
               </DropdownMenu>
               
               <button
                 onClick={onClose}
                 className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
           </div>
 
           {/* Viewers overlay */}
           {showViewers && isOwnStory && (
             <div className="absolute top-20 left-4 right-4 z-30 bg-black/80 rounded-lg p-3 max-h-40 overflow-y-auto">
               <div className="flex items-center gap-2 mb-2">
                 <Users className="w-4 h-4 text-white" />
                 <span className="text-white text-sm font-medium">{viewCount} viewers</span>
               </div>
               {viewers.length === 0 ? (
                 <p className="text-white/60 text-xs">No viewers yet</p>
               ) : (
                 <div className="space-y-2">
                   {viewers.map((v: any) => (
                     <div key={v.user_id} className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-white/20" />
                       <span className="text-white text-xs">User</span>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
 
           {/* Content */}
           <div className="flex-1 flex items-center justify-center bg-black">
             {currentPost.image_url ? (
               <PostMedia url={currentPost.image_url} />
             ) : (
               <div className="p-8 flex items-center justify-center">
                 <p className="text-white text-xl text-center font-medium">
                   {currentPost.content}
                 </p>
               </div>
             )}
           </div>
 
           {/* Caption */}
           {currentPost.image_url && currentPost.content && (
             <div className="absolute bottom-32 left-4 right-4 z-20">
               <p className="text-white text-sm bg-black/50 rounded-lg p-3">
                 {currentPost.content}
               </p>
             </div>
           )}
 
           {/* Reaction bar and reply input */}
           {!isOwnStory && (
             <div className="absolute bottom-4 left-4 right-4 z-20 space-y-3">
               {/* Reactions */}
               <div className="flex items-center justify-center gap-4">
                 <ReactionBtn
                   icon={Heart}
                   active={userReaction === 'heart'}
                   onClick={() => addReaction('heart')}
                   color="text-pink-500"
                 />
                 <ReactionBtn
                   icon={Flame}
                   active={userReaction === 'fire'}
                   onClick={() => addReaction('fire')}
                   color="text-orange-500"
                 />
                 <ReactionBtn
                   icon={Hand}
                   active={userReaction === 'clap'}
                   onClick={() => addReaction('clap')}
                   color="text-yellow-500"
                 />
               </div>
               
               {/* Reply input */}
               <div className="flex gap-2">
                 <Input
                   placeholder="Reply to story..."
                   value={replyText}
                   onChange={(e) => setReplyText(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                   className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                 />
                 <Button
                   size="icon"
                   onClick={handleReply}
                   disabled={!replyText.trim()}
                   className="bg-white/20 hover:bg-white/30"
                 >
                   <Send className="w-4 h-4 text-white" />
                 </Button>
               </div>
             </div>
           )}
 
           {/* Navigation areas */}
           <button
             onClick={handlePrevNav}
             className="absolute left-0 top-20 bottom-32 w-1/3 z-10"
             aria-label="Previous"
           />
           <button
             onClick={handleNextNav}
             className="absolute right-0 top-20 bottom-32 w-1/3 z-10"
             aria-label="Next"
           />
 
           {/* Navigation arrows for desktop */}
           <button
             onClick={handlePrevNav}
             className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors hidden sm:block z-20"
           >
             <ChevronLeft className="w-6 h-6" />
           </button>
           <button
             onClick={handleNextNav}
             className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors hidden sm:block z-20"
           >
             <ChevronRight className="w-6 h-6" />
           </button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }
 
 function ReactionBtn({
   icon: Icon,
   active,
   onClick,
   color,
 }: {
   icon: typeof Heart;
   active: boolean;
   onClick: () => void;
   color: string;
 }) {
   return (
     <button
       onClick={onClick}
       className={cn(
         "p-3 rounded-full transition-all",
         active ? `${color} bg-white/20 scale-110` : "text-white/70 hover:text-white hover:bg-white/10"
       )}
     >
       <Icon className={cn("w-6 h-6", active && "fill-current")} />
     </button>
   );
 }