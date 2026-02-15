
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  from_user_id UUID,
  reference_id TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
ON public.push_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Friend request notification trigger
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_username TEXT;
BEGIN
  SELECT username INTO sender_username FROM profiles WHERE user_id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
  VALUES (NEW.friend_id, 'friend_request', 'New friend request', '@' || sender_username || ' sent you a friend request', NEW.user_id, NEW.id::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_friend_request ON public.friendships;
CREATE TRIGGER on_friend_request
AFTER INSERT ON public.friendships
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_friend_request();

-- Friend accepted notification trigger
CREATE OR REPLACE FUNCTION public.notify_friend_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  accepter_username TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT username INTO accepter_username FROM profiles WHERE user_id = NEW.friend_id;
    INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
    VALUES (NEW.user_id, 'friend_accepted', 'Friend request accepted', '@' || accepter_username || ' accepted your friend request', NEW.friend_id, NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_friend_accepted ON public.friendships;
CREATE TRIGGER on_friend_accepted
AFTER UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.notify_friend_accepted();

-- Post like notification trigger (replaces old like count trigger)
DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;

CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  liker_username TEXT;
  post_owner UUID;
BEGIN
  SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
  UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  IF post_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT username INTO liker_username FROM profiles WHERE user_id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
  VALUES (post_owner, 'like', 'New like', '@' || liker_username || ' liked your post', NEW.user_id, NEW.post_id::text);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_like();

-- Unlike count trigger
DROP TRIGGER IF EXISTS on_post_unlike ON public.post_likes;

CREATE OR REPLACE FUNCTION public.notify_post_unlike()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_post_unlike
AFTER DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_unlike();

-- Story reply notification trigger
CREATE OR REPLACE FUNCTION public.notify_story_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_username TEXT;
BEGIN
  SELECT username INTO sender_username FROM profiles WHERE user_id = NEW.sender_id;
  INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
  VALUES (NEW.receiver_id, 'story_reply', 'Story reply', '@' || sender_username || ' replied to your story', NEW.sender_id, NEW.story_id::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_story_reply ON public.story_replies;
CREATE TRIGGER on_story_reply
AFTER INSERT ON public.story_replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_story_reply();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
