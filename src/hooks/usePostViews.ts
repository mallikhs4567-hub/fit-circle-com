 import { useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from './useAuth';
 
 export function usePostViews() {
   const { user } = useAuth();
 
   const recordView = async (postId: string) => {
     if (!user || postId.startsWith('demo-')) return;
 
     try {
       await supabase
         .from('post_views')
         .upsert(
           { post_id: postId, user_id: user.id },
           { onConflict: 'post_id,user_id', ignoreDuplicates: true }
         );
     } catch (error) {
       // Silently fail - view tracking is non-critical
     }
   };
 
   const getViewers = async (postId: string) => {
     if (postId.startsWith('demo-')) return [];
 
     const { data } = await supabase
       .from('post_views')
       .select(`
         user_id,
         created_at,
         profiles!post_views_user_id_fkey(username, avatar_url)
       `)
       .eq('post_id', postId)
       .order('created_at', { ascending: false });
 
     return data || [];
   };
 
   return { recordView, getViewers };
 }