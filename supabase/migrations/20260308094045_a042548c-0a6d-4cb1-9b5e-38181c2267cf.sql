
-- FIX 1: Remove client UPDATE on weekly_xp_leaderboard (award_xp handles it via SECURITY DEFINER)
DROP POLICY IF EXISTS "Users can update own leaderboard entry" ON public.weekly_xp_leaderboard;

-- FIX 2: Remove client INSERT on weekly_xp_leaderboard (award_xp handles it via SECURITY DEFINER) 
DROP POLICY IF EXISTS "Users can insert own leaderboard entry" ON public.weekly_xp_leaderboard;

-- FIX 3: Remove client INSERT on notifications (triggers handle it via SECURITY DEFINER)
DROP POLICY IF EXISTS "Only system can create notifications" ON public.notifications;

-- FIX 4: Restrict post_views SELECT to post owner only
DROP POLICY IF EXISTS "Users can view post views" ON public.post_views;
CREATE POLICY "Post owners can view their post views" ON public.post_views
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_views.post_id AND posts.user_id = auth.uid())
  OR auth.uid() = user_id
);
