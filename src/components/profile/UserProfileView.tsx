 import { useEffect, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/common/Avatar';
import { StreakBadge } from '@/components/common/StreakBadge';
import { GoalBadge } from '@/components/common/GoalBadge';
import { LevelIndicator } from '@/components/common/LevelIndicator';
 import { Button } from '@/components/ui/button';
 import { Dialog, DialogContent } from '@/components/ui/dialog';
 import { PostCard } from '@/components/circle/PostCard';
 import { ArrowLeft, MessageCircle, UserPlus, Loader2 } from 'lucide-react';
 import { useFriends } from '@/hooks/useFriends';
 import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 
 interface UserProfileViewProps {
   userId: string | null;
   onClose: () => void;
 }
 
interface UserProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  streak: number;
  goal: string | null;
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
 
 export function UserProfileView({ userId, onClose }: UserProfileViewProps) {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { friends, sendFriendRequest, sentRequests, pendingRequests } = useFriends();
   const [profile, setProfile] = useState<UserProfile | null>(null);
   const [posts, setPosts] = useState<UserPost[]>([]);
   const [loading, setLoading] = useState(true);
 
   const isFriend = friends.some(f => f.user_id === userId);
   const hasSentRequest = sentRequests.some(r => r.user_id === userId);
   const hasPendingRequest = pendingRequests.some(r => r.user_id === userId);
 
   useEffect(() => {
     if (!userId) return;
 
     const fetchUserData = async () => {
       setLoading(true);
 
       // Fetch profile
       const { data: profileData } = await supabase
         .from('profiles')
         .select('user_id, username, avatar_url, bio, streak')
         .eq('user_id', userId)
         .single();
 
       if (profileData) {
         setProfile(profileData as UserProfile);
       }
 
       // Fetch user's permanent posts (no expiry or not expired)
       const { data: postsData } = await supabase
         .from('posts')
         .select('*')
         .eq('user_id', userId)
         .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
         .order('created_at', { ascending: false });
 
       if (postsData) {
         setPosts(postsData as UserPost[]);
       }
 
       setLoading(false);
     };
 
     fetchUserData();
   }, [userId]);
 
   const handleAddFriend = async () => {
     if (!profile) return;
     await sendFriendRequest(profile.username);
   };
 
   const handleMessage = () => {
     if (!userId) return;
     navigate('/chat', { state: { selectedUserId: userId } });
     onClose();
   };
 
   if (!userId) return null;
 
   return (
     <Dialog open={!!userId} onOpenChange={() => onClose()}>
       <DialogContent className="max-w-md w-full h-[90vh] p-0 overflow-hidden">
         <div className="h-full flex flex-col bg-background">
           {/* Header */}
           <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
             <button onClick={onClose} className="p-2 -ml-2">
               <ArrowLeft className="w-5 h-5" />
             </button>
             <span className="font-semibold text-foreground">Profile</span>
           </div>
 
           {loading ? (
             <div className="flex-1 flex items-center justify-center">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
           ) : profile ? (
             <div className="flex-1 overflow-y-auto">
               {/* Profile Info */}
               <div className="p-6 text-center border-b border-border">
                 <Avatar
                   name={profile.username}
                   src={profile.avatar_url}
                   size="xl"
                   showBorder
                   className="mx-auto mb-4"
                 />
                 <h2 className="text-xl font-display font-bold text-foreground mb-1">
                   @{profile.username}
                 </h2>
                 {profile.bio && (
                   <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>
                 )}
                 <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-streak/10 border border-streak/20 mb-4">
                   <StreakBadge streak={profile.streak} size="md" animate={profile.streak > 0} />
                 </div>
 
                 {/* Actions */}
                 {user?.id !== userId && (
                   <div className="flex gap-3 justify-center mt-4">
                     {isFriend ? (
                       <Button onClick={handleMessage}>
                         <MessageCircle className="w-4 h-4 mr-2" />
                         Message
                       </Button>
                     ) : hasSentRequest ? (
                       <Button variant="secondary" disabled>
                         Request Sent
                       </Button>
                     ) : hasPendingRequest ? (
                       <Button variant="secondary" disabled>
                         Request Pending
                       </Button>
                     ) : (
                       <Button onClick={handleAddFriend}>
                         <UserPlus className="w-4 h-4 mr-2" />
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
                   <p className="text-center text-muted-foreground py-8">
                     No posts yet
                   </p>
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
           ) : (
             <div className="flex-1 flex items-center justify-center">
               <p className="text-muted-foreground">User not found</p>
             </div>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 }