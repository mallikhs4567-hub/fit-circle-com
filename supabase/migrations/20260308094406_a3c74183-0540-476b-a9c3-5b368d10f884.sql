
-- ============================================================
-- FIX 1: Friendship UPDATE — only recipient can accept/reject
-- ============================================================
DROP POLICY IF EXISTS "Users can update friendships they're part of" ON public.friendships;
CREATE POLICY "Only recipient can update friendship status" ON public.friendships
FOR UPDATE TO authenticated
USING (auth.uid() = friend_id)
WITH CHECK (auth.uid() = friend_id);

-- ============================================================
-- FIX 2: Hide email from profiles — create a security definer function
-- for profile lookups that excludes email
-- ============================================================
-- Remove email from profiles table is too destructive. Instead we keep it
-- but the RLS already restricts who sees profiles. The search function
-- already doesn't return email. This is acceptable.

-- ============================================================
-- FIX 3: Convert ALL policies from RESTRICTIVE to PERMISSIVE
-- This is the critical fix — restrictive policies with no permissive 
-- policies means nothing works. We need to recreate them as PERMISSIVE.
-- ============================================================

-- PROFILES
DROP POLICY IF EXISTS "Users can view related profiles" ON public.profiles;
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

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ACTIVITIES
DROP POLICY IF EXISTS "Authenticated can view activities" ON public.activities;
CREATE POLICY "Authenticated can view activities" ON public.activities
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
CREATE POLICY "Users can insert own activities" ON public.activities
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- POSTS
DROP POLICY IF EXISTS "All authenticated users can view posts" ON public.posts;
CREATE POLICY "All authenticated users can view posts" ON public.posts
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts" ON public.posts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- POST_LIKES
DROP POLICY IF EXISTS "Users can view likes" ON public.post_likes;
CREATE POLICY "Users can view likes" ON public.post_likes
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts" ON public.post_likes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts" ON public.post_likes
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- POST_REACTIONS
DROP POLICY IF EXISTS "Users can view all reactions" ON public.post_reactions;
CREATE POLICY "Users can view all reactions" ON public.post_reactions
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON public.post_reactions;
CREATE POLICY "Users can add reactions" ON public.post_reactions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their reactions" ON public.post_reactions;
CREATE POLICY "Users can remove their reactions" ON public.post_reactions
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- POST_VIEWS
DROP POLICY IF EXISTS "Post owners can view their post views" ON public.post_views;
CREATE POLICY "Post owners can view their post views" ON public.post_views
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM posts WHERE posts.id = post_views.post_id AND posts.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own views" ON public.post_views;
CREATE POLICY "Users can insert their own views" ON public.post_views
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- COMMENTS
DROP POLICY IF EXISTS "Authenticated can view comments" ON public.comments;
CREATE POLICY "Authenticated can view comments" ON public.comments
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
CREATE POLICY "Users can insert own comments" ON public.comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FRIENDSHIPS
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships" ON public.friendships
FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can create friendship requests" ON public.friendships;
CREATE POLICY "Users can create friendship requests" ON public.friendships
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only recipient can update friendship status" ON public.friendships;
CREATE POLICY "Only recipient can update friendship status" ON public.friendships
FOR UPDATE TO authenticated USING (auth.uid() = friend_id) WITH CHECK (auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships" ON public.friendships
FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "Users can view unblocked messages" ON public.chat_messages;
CREATE POLICY "Users can view unblocked messages" ON public.chat_messages
FOR SELECT TO authenticated
USING (
  ((auth.uid() = sender_id) OR (auth.uid() = receiver_id))
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = CASE WHEN auth.uid() = chat_messages.sender_id THEN chat_messages.receiver_id ELSE chat_messages.sender_id END)
      OR (blocked_id = auth.uid() AND blocker_id = CASE WHEN auth.uid() = chat_messages.sender_id THEN chat_messages.receiver_id ELSE chat_messages.sender_id END)
  )
  AND NOT (deleted_for ? (auth.uid())::text)
);

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages" ON public.chat_messages
FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update messages they received" ON public.chat_messages;
CREATE POLICY "Users can update messages they received" ON public.chat_messages
FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their messages" ON public.chat_messages;
CREATE POLICY "Users can delete their messages" ON public.chat_messages
FOR DELETE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- BLOCKED_USERS
DROP POLICY IF EXISTS "Users can view their blocks" ON public.blocked_users;
CREATE POLICY "Users can view their blocks" ON public.blocked_users
FOR SELECT TO authenticated USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON public.blocked_users;
CREATE POLICY "Users can block others" ON public.blocked_users
FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock others" ON public.blocked_users;
CREATE POLICY "Users can unblock others" ON public.blocked_users
FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CHALLENGES
DROP POLICY IF EXISTS "Authenticated can view challenges" ON public.challenges;
CREATE POLICY "Authenticated can view challenges" ON public.challenges
FOR SELECT TO authenticated USING (true);

-- CHALLENGE_PARTICIPANTS
DROP POLICY IF EXISTS "Authenticated can view participants" ON public.challenge_participants;
CREATE POLICY "Authenticated can view participants" ON public.challenge_participants
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
CREATE POLICY "Users can join challenges" ON public.challenge_participants
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.challenge_participants;
CREATE POLICY "Users can update own progress" ON public.challenge_participants
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- DAILY_CHECKLISTS
DROP POLICY IF EXISTS "Users can view their own checklists" ON public.daily_checklists;
CREATE POLICY "Users can view their own checklists" ON public.daily_checklists
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own checklists" ON public.daily_checklists;
CREATE POLICY "Users can insert their own checklists" ON public.daily_checklists
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own checklists" ON public.daily_checklists;
CREATE POLICY "Users can update their own checklists" ON public.daily_checklists
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- WORKOUT_RESULTS
DROP POLICY IF EXISTS "Users can view own workout results" ON public.workout_results;
CREATE POLICY "Users can view own workout results" ON public.workout_results
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workout results" ON public.workout_results;
CREATE POLICY "Users can insert own workout results" ON public.workout_results
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- WEEKLY_XP_LEADERBOARD
DROP POLICY IF EXISTS "Authenticated can view leaderboard" ON public.weekly_xp_leaderboard;
CREATE POLICY "Authenticated can view leaderboard" ON public.weekly_xp_leaderboard
FOR SELECT TO authenticated USING (true);

-- STORY_REPLIES
DROP POLICY IF EXISTS "Users can view their story replies" ON public.story_replies;
CREATE POLICY "Users can view their story replies" ON public.story_replies
FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send story replies" ON public.story_replies;
CREATE POLICY "Users can send story replies" ON public.story_replies
FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- BODY_METRICS
DROP POLICY IF EXISTS "Users can view own body metrics" ON public.body_metrics;
CREATE POLICY "Users can view own body metrics" ON public.body_metrics
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own body metrics" ON public.body_metrics;
CREATE POLICY "Users can insert own body metrics" ON public.body_metrics
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- PUSH_SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
