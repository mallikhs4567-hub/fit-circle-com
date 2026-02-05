 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from './useAuth';
 import { toast } from 'sonner';
 
 export function useBlocking() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const { data: blockedUsers = [] } = useQuery({
     queryKey: ['blocked-users', user?.id],
     queryFn: async () => {
       if (!user) return [];
 
       const { data } = await supabase
         .from('blocked_users')
         .select('blocked_id')
         .eq('blocker_id', user.id);
 
       return data?.map(b => b.blocked_id) || [];
     },
     enabled: !!user,
   });
 
   const blockMutation = useMutation({
     mutationFn: async (userId: string) => {
       if (!user) throw new Error('Not authenticated');
       
       await supabase
         .from('blocked_users')
         .insert({ blocker_id: user.id, blocked_id: userId });
     },
     onSuccess: () => {
       toast.success('User blocked');
       queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
       queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
     },
     onError: () => {
       toast.error('Failed to block user');
     },
   });
 
   const unblockMutation = useMutation({
     mutationFn: async (userId: string) => {
       if (!user) throw new Error('Not authenticated');
       
       await supabase
         .from('blocked_users')
         .delete()
         .eq('blocker_id', user.id)
         .eq('blocked_id', userId);
     },
     onSuccess: () => {
       toast.success('User unblocked');
       queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
       queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
     },
     onError: () => {
       toast.error('Failed to unblock user');
     },
   });
 
   return {
     blockedUsers,
     isBlocked: (userId: string) => blockedUsers.includes(userId),
     blockUser: (userId: string) => blockMutation.mutate(userId),
     unblockUser: (userId: string) => unblockMutation.mutate(userId),
   };
 }