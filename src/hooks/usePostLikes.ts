 import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from './useAuth';
 
 export function usePostLikes(postId: string) {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const { data: isLiked = false } = useQuery({
     queryKey: ['post-like', postId, user?.id],
     queryFn: async () => {
       if (!user || postId.startsWith('demo-')) return false;
       
       const { data } = await supabase
         .from('post_likes')
         .select('id')
         .eq('post_id', postId)
         .eq('user_id', user.id)
         .maybeSingle();
       
       return !!data;
     },
     enabled: !!user && !postId.startsWith('demo-'),
   });
 
   const toggleLikeMutation = useMutation({
     mutationFn: async () => {
       if (!user || postId.startsWith('demo-')) return;
 
       if (isLiked) {
         await supabase
           .from('post_likes')
           .delete()
           .eq('post_id', postId)
           .eq('user_id', user.id);
       } else {
         await supabase
           .from('post_likes')
           .insert({ post_id: postId, user_id: user.id });
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['post-like', postId] });
       queryClient.invalidateQueries({ queryKey: ['posts'] });
     },
   });
 
   return {
     isLiked,
     toggleLike: () => toggleLikeMutation.mutate(),
   };
 }