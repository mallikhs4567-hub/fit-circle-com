 import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from './useAuth';
 import { toast } from 'sonner';
 
 export function useStoryInteractions(storyId: string) {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   // Record view when story is opened
   const recordView = async () => {
     if (!user || storyId.startsWith('demo-')) return;
     
     try {
       await supabase
         .from('post_views')
         .upsert(
           { post_id: storyId, user_id: user.id },
           { onConflict: 'post_id,user_id', ignoreDuplicates: true }
         );
     } catch (error) {
       // Silently fail
     }
   };
 
   // Get viewers
   const { data: viewers = [] } = useQuery({
     queryKey: ['story-viewers', storyId],
     queryFn: async () => {
       if (storyId.startsWith('demo-')) return [];
       
       const { data } = await supabase
         .from('post_views')
         .select('user_id, created_at')
         .eq('post_id', storyId);
       
       return data || [];
     },
     enabled: !!user && !storyId.startsWith('demo-'),
   });
 
   // Get reactions for this story
   const { data: reactions = [] } = useQuery({
     queryKey: ['story-reactions', storyId],
     queryFn: async () => {
       if (storyId.startsWith('demo-')) return [];
       
       const { data } = await supabase
         .from('post_reactions')
         .select('user_id, reaction_type, created_at')
         .eq('post_id', storyId);
       
       return data || [];
     },
     enabled: !!user && !storyId.startsWith('demo-'),
   });
 
   // Add reaction
   const addReactionMutation = useMutation({
     mutationFn: async (reactionType: 'heart' | 'fire' | 'clap') => {
       if (!user || storyId.startsWith('demo-')) return;
 
       // Check if user already reacted
       const { data: existing } = await supabase
         .from('post_reactions')
         .select('id, reaction_type')
         .eq('post_id', storyId)
         .eq('user_id', user.id)
         .maybeSingle();
 
       if (existing) {
         if (existing.reaction_type === reactionType) {
           // Remove reaction
           await supabase
             .from('post_reactions')
             .delete()
             .eq('id', existing.id);
         } else {
           // Update reaction
           await supabase
             .from('post_reactions')
             .update({ reaction_type: reactionType })
             .eq('id', existing.id);
         }
       } else {
         // Add new reaction
         await supabase
           .from('post_reactions')
           .insert({ post_id: storyId, user_id: user.id, reaction_type: reactionType });
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['story-reactions', storyId] });
       queryClient.invalidateQueries({ queryKey: ['stories'] });
     },
   });
 
   // Send reply
   const sendReplyMutation = useMutation({
     mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
       if (!user || storyId.startsWith('demo-')) return;
 
       await supabase
         .from('story_replies')
         .insert({
           story_id: storyId,
           sender_id: user.id,
           receiver_id: receiverId,
           content,
         });
 
       // Also add to chat_messages for visibility
       await supabase
         .from('chat_messages')
         .insert({
           sender_id: user.id,
           receiver_id: receiverId,
           content: `📸 Replied to your story: "${content}"`,
         });
     },
     onSuccess: () => {
       toast.success('Reply sent!');
     },
     onError: () => {
       toast.error('Failed to send reply');
     },
   });
 
   // Delete story
   const deleteStoryMutation = useMutation({
     mutationFn: async () => {
       if (!user || storyId.startsWith('demo-')) return;
 
       await supabase
         .from('posts')
         .delete()
         .eq('id', storyId)
         .eq('user_id', user.id);
     },
     onSuccess: () => {
       toast.success('Story deleted');
       queryClient.invalidateQueries({ queryKey: ['stories'] });
       queryClient.invalidateQueries({ queryKey: ['posts'] });
     },
     onError: () => {
       toast.error('Failed to delete story');
     },
   });
 
   return {
     viewers,
     reactions,
     viewCount: viewers.length,
     recordView,
     addReaction: (type: 'heart' | 'fire' | 'clap') => addReactionMutation.mutate(type),
     sendReply: (receiverId: string, content: string) => 
       sendReplyMutation.mutate({ receiverId, content }),
     deleteStory: () => deleteStoryMutation.mutate(),
     userReaction: reactions.find(r => r.user_id === user?.id)?.reaction_type,
   };
 }