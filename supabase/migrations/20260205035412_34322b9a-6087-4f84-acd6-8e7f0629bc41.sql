-- ============================================
-- COMPREHENSIVE SCHEMA UPDATE FOR FITCIRCLE
-- ============================================

-- 1. Add 'bio' column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- 2. Add 'type' column to posts to distinguish stories from permanent posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS type text DEFAULT 'story' CHECK (type IN ('story', 'post'));

-- 3. Add 'view_count' and 'like_count' to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;

-- 4. Make expires_at nullable for permanent posts
ALTER TABLE public.posts ALTER COLUMN expires_at DROP NOT NULL;

-- 5. Create post_views table (track unique views)
CREATE TABLE IF NOT EXISTS public.post_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view post views" ON public.post_views
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own views" ON public.post_views
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create post_likes table (separate from reactions for permanent posts)
CREATE TABLE IF NOT EXISTS public.post_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes" ON public.post_likes
FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.post_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.post_likes
FOR DELETE USING (auth.uid() = user_id);

-- 7. Create story_replies table (private messages from stories)
CREATE TABLE IF NOT EXISTS public.story_replies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their story replies" ON public.story_replies
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send story replies" ON public.story_replies
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 8. Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id uuid NOT NULL,
    blocked_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their blocks" ON public.blocked_users
FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others" ON public.blocked_users
FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others" ON public.blocked_users
FOR DELETE USING (auth.uid() = blocker_id);

-- 9. Add deleted_for_user column to chat_messages for one-sided deletion
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS deleted_for jsonb DEFAULT '[]'::jsonb;

-- 10. Allow DELETE on friendships (for canceling sent requests)
CREATE POLICY "Users can delete their friendships" ON public.friendships
FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 11. Allow DELETE on chat_messages for the receiver (delete from their view)
CREATE POLICY "Users can delete their messages" ON public.chat_messages
FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 12. Update chat_messages SELECT policy to respect blocks
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
CREATE POLICY "Users can view unblocked messages" ON public.chat_messages
FOR SELECT USING (
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
    AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE (blocker_id = auth.uid() AND blocked_id = CASE WHEN auth.uid() = sender_id THEN receiver_id ELSE sender_id END)
        OR (blocked_id = auth.uid() AND blocker_id = CASE WHEN auth.uid() = sender_id THEN receiver_id ELSE sender_id END)
    )
    AND NOT (deleted_for ? auth.uid()::text)
);

-- 13. Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.posts SET view_count = view_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_view ON public.post_views;
CREATE TRIGGER on_post_view
AFTER INSERT ON public.post_views
FOR EACH ROW
EXECUTE FUNCTION public.increment_view_count();

-- 14. Function to update like count
CREATE OR REPLACE FUNCTION public.update_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;
CREATE TRIGGER on_post_like
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_like_count();

-- 15. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_users;