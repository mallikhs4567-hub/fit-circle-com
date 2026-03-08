
-- ============================================================
-- FIX 1: Profiles SELECT — remove pending friendship access, hide email via view
-- ============================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view related profiles" ON public.profiles;

-- New policy: own profile OR accepted friends only (no pending)
CREATE POLICY "Users can view related profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = profiles.user_id)
        OR (friend_id = auth.uid() AND user_id = profiles.user_id))
  )
);

-- ============================================================
-- FIX 2: Restrict post_views SELECT to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Users can view post views" ON public.post_views;
CREATE POLICY "Users can view post views" ON public.post_views
FOR SELECT TO authenticated USING (true);

-- ============================================================
-- FIX 3: Restrict post_likes SELECT to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Users can view likes" ON public.post_likes;
CREATE POLICY "Users can view likes" ON public.post_likes
FOR SELECT TO authenticated USING (true);

-- ============================================================
-- FIX 4: Restrict post_reactions SELECT to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Users can view all reactions" ON public.post_reactions;
CREATE POLICY "Users can view all reactions" ON public.post_reactions
FOR SELECT TO authenticated USING (true);

-- ============================================================
-- FIX 5: Restrict comments SELECT to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Authenticated can view comments" ON public.comments
FOR SELECT TO authenticated USING (true);

-- ============================================================
-- FIX 6: Restrict weekly_xp_leaderboard SELECT to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.weekly_xp_leaderboard;
CREATE POLICY "Authenticated can view leaderboard" ON public.weekly_xp_leaderboard
FOR SELECT TO authenticated USING (true);

-- ============================================================
-- FIX 7: Restrict challenges SELECT to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;
CREATE POLICY "Authenticated can view challenges" ON public.challenges
FOR SELECT TO authenticated USING (true);

-- ============================================================
-- FIX 8: Restrict challenge_participants SELECT to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view participants" ON public.challenge_participants;
CREATE POLICY "Authenticated can view participants" ON public.challenge_participants
FOR SELECT TO authenticated USING (true);

-- ============================================================
-- FIX 9: Restrict activities SELECT to authenticated only (already was, but confirm)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view activities" ON public.activities;
CREATE POLICY "Authenticated can view activities" ON public.activities
FOR SELECT TO authenticated USING (true);
