-- ============================================
-- FitCircle - Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLES
-- ============================================

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  email text,
  avatar_url text,
  bio text,
  goal text,
  experience_level text,
  gender text,
  height integer,
  weight integer,
  streak integer DEFAULT 0,
  total_active_days integer DEFAULT 0,
  xp integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id),
  content text NOT NULL,
  image_url text,
  type text DEFAULT 'story',
  reactions jsonb DEFAULT '{"clap": 0, "fire": 0, "heart": 0}'::jsonb,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id),
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id),
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id),
  user_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, reaction_type)
);

CREATE TABLE public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id),
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  read_at timestamptz,
  deleted_for jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  reference_id text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.story_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.posts(id),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.daily_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  workout_completed boolean DEFAULT false,
  diet_followed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE TABLE public.workout_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_name text NOT NULL,
  reps_completed integer NOT NULL DEFAULT 0,
  avg_form_score numeric NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  calories_burned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.body_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shoulder_width_ratio numeric,
  waist_ratio numeric,
  posture_score numeric,
  weight numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.weekly_xp_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 2. ENABLE REALTIME (optional)
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ============================================
-- 3. FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  clean_username TEXT;
BEGIN
  clean_username := COALESCE(trim(new.raw_user_meta_data ->> 'username'), 'user_' || substr(new.id::text, 1, 8));
  IF NOT clean_username ~ '^[a-zA-Z0-9_]{3,30}$' THEN
    clean_username := 'user_' || substr(new.id::text, 1, 8);
  END IF;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = clean_username) LOOP
    clean_username := clean_username || '_' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;
  INSERT INTO public.profiles (user_id, username, email) VALUES (new.id, clean_username, new.email);
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.profiles (user_id, username, email) VALUES (new.id, 'user_' || substr(new.id::text, 1, 8), new.email);
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_users_by_username(search_username text)
RETURNS TABLE(user_id uuid, username text, avatar_url text, streak integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.username, p.avatar_url, p.streak
  FROM profiles p
  WHERE LOWER(p.username) LIKE LOWER('%' || search_username || '%')
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer)
RETURNS TABLE(new_xp integer, new_level integer, leveled_up boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  old_xp integer; updated_xp integer; old_level integer; cur_level integer; week_start_date date;
BEGIN
  SELECT COALESCE(xp, 0) INTO old_xp FROM profiles WHERE profiles.user_id = p_user_id;
  old_level := old_xp / 100 + 1;
  UPDATE profiles SET xp = COALESCE(xp, 0) + p_amount WHERE profiles.user_id = p_user_id RETURNING xp INTO updated_xp;
  cur_level := updated_xp / 100 + 1;
  week_start_date := date_trunc('week', now())::date;
  INSERT INTO weekly_xp_leaderboard (user_id, week_start, xp) VALUES (p_user_id, week_start_date, p_amount)
  ON CONFLICT (user_id, week_start) DO UPDATE SET xp = weekly_xp_leaderboard.xp + p_amount;
  RETURN QUERY SELECT updated_xp, cur_level, (cur_level > old_level);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_chat_for_user(other_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.chat_messages SET deleted_for = deleted_for || to_jsonb(auth.uid()::text)
  WHERE (sender_id = auth.uid() AND receiver_id = other_user_id)
     OR (sender_id = other_user_id AND receiver_id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_view_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.xp IS DISTINCT FROM NEW.xp THEN RAISE EXCEPTION 'xp can only be modified via award_xp function'; END IF;
  IF OLD.streak IS DISTINCT FROM NEW.streak THEN RAISE EXCEPTION 'streak can only be modified via system functions'; END IF;
  IF OLD.total_active_days IS DISTINCT FROM NEW.total_active_days THEN RAISE EXCEPTION 'total_active_days can only be modified via system functions'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_chat_message_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN RAISE EXCEPTION 'Cannot modify message content'; END IF;
  IF OLD.sender_id IS DISTINCT FROM NEW.sender_id THEN RAISE EXCEPTION 'Cannot modify sender_id'; END IF;
  IF OLD.receiver_id IS DISTINCT FROM NEW.receiver_id THEN RAISE EXCEPTION 'Cannot modify receiver_id'; END IF;
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN RAISE EXCEPTION 'Cannot modify created_at'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_post_reaction_counts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE counts JSONB;
BEGIN
  SELECT jsonb_build_object(
    'heart', COUNT(*) FILTER (WHERE reaction_type = 'heart'),
    'fire', COUNT(*) FILTER (WHERE reaction_type = 'fire'),
    'clap', COUNT(*) FILTER (WHERE reaction_type = 'clap')
  ) INTO counts FROM post_reactions WHERE post_id = COALESCE(NEW.post_id, OLD.post_id);
  UPDATE posts SET reactions = counts WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_username TEXT;
BEGIN
  IF NEW.sender_id = NEW.receiver_id THEN RETURN NEW; END IF;
  SELECT username INTO sender_username FROM profiles WHERE user_id = NEW.sender_id;
  INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
  VALUES (NEW.receiver_id, 'chat_message', 'New message', '@' || sender_username || ': ' || LEFT(NEW.content, 50), NEW.sender_id, NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE commenter_username TEXT; post_owner UUID;
BEGIN
  SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
  IF post_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT username INTO commenter_username FROM profiles WHERE user_id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
  VALUES (post_owner, 'comment', 'New comment', '@' || commenter_username || ': ' || LEFT(NEW.content, 50), NEW.user_id, NEW.post_id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_username TEXT;
BEGIN
  SELECT username INTO sender_username FROM profiles WHERE user_id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
  VALUES (NEW.friend_id, 'friend_request', 'New friend request', '@' || sender_username || ' sent you a friend request', NEW.user_id, NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_friend_accepted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE accepter_username TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT username INTO accepter_username FROM profiles WHERE user_id = NEW.friend_id;
    INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
    VALUES (NEW.user_id, 'friend_accepted', 'Friend request accepted', '@' || accepter_username || ' accepted your friend request', NEW.friend_id, NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE liker_username TEXT; post_owner UUID;
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

CREATE OR REPLACE FUNCTION public.notify_post_unlike()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_story_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_username TEXT;
BEGIN
  SELECT username INTO sender_username FROM profiles WHERE user_id = NEW.sender_id;
  INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
  VALUES (NEW.receiver_id, 'story_reply', 'Story reply', '@' || sender_username || ' replied to your story', NEW.sender_id, NEW.story_id::text);
  RETURN NEW;
END;
$$;

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Auth trigger (create profile on signup)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER validate_profile_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_update();

-- Chat triggers
CREATE TRIGGER protect_chat_fields
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.protect_chat_message_fields();

CREATE TRIGGER on_chat_message_insert
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_chat_message();

-- Post view trigger
CREATE TRIGGER on_post_view_insert
  AFTER INSERT ON public.post_views
  FOR EACH ROW EXECUTE FUNCTION public.increment_view_count();

-- Post like triggers
CREATE TRIGGER on_post_like_insert
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

CREATE TRIGGER on_post_like_delete
  AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_unlike();

-- Post reaction triggers
CREATE TRIGGER on_post_reaction_insert
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_reaction_counts();

CREATE TRIGGER on_post_reaction_delete
  AFTER DELETE ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_reaction_counts();

-- Comment trigger
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

-- Friendship triggers
CREATE TRIGGER on_friend_request
  AFTER INSERT ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();

CREATE TRIGGER on_friend_accepted
  AFTER UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_accepted();

-- Story reply trigger
CREATE TRIGGER on_story_reply_insert
  AFTER INSERT ON public.story_replies
  FOR EACH ROW EXECUTE FUNCTION public.notify_story_reply();

-- ============================================
-- 5. ENABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_xp_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view related profiles" ON public.profiles FOR SELECT USING (
  (auth.uid() = user_id)
  OR EXISTS (
    SELECT 1 FROM friendships
    WHERE friendships.status = 'accepted'
      AND ((friendships.user_id = auth.uid() AND friendships.friend_id = profiles.user_id)
        OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.user_id))
  )
  OR EXISTS (
    SELECT 1 FROM friendships
    WHERE friendships.status = 'pending'
      AND ((friendships.user_id = auth.uid() AND friendships.friend_id = profiles.user_id)
        OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.user_id))
  )
);

-- Posts
CREATE POLICY "All authenticated users can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Post Likes
CREATE POLICY "Users can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post Reactions
CREATE POLICY "Users can view all reactions" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their reactions" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Post Views
CREATE POLICY "Users can view post views" ON public.post_views FOR SELECT USING (true);
CREATE POLICY "Users can insert their own views" ON public.post_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friendships
CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendship requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update friendships they're part of" ON public.friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete their friendships" ON public.friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Chat Messages
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update messages they received" ON public.chat_messages FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Users can delete their messages" ON public.chat_messages FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can view unblocked messages" ON public.chat_messages FOR SELECT USING (
  ((auth.uid() = sender_id) OR (auth.uid() = receiver_id))
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocked_users.blocker_id = auth.uid() AND blocked_users.blocked_id =
      CASE WHEN auth.uid() = chat_messages.sender_id THEN chat_messages.receiver_id ELSE chat_messages.sender_id END)
    OR (blocked_users.blocked_id = auth.uid() AND blocked_users.blocker_id =
      CASE WHEN auth.uid() = chat_messages.sender_id THEN chat_messages.receiver_id ELSE chat_messages.sender_id END)
  )
  AND NOT (deleted_for ? (auth.uid())::text)
);

-- Blocked Users
CREATE POLICY "Users can view their blocks" ON public.blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock others" ON public.blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Only system can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Story Replies
CREATE POLICY "Users can view their story replies" ON public.story_replies FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send story replies" ON public.story_replies FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Daily Checklists
CREATE POLICY "Users can view their own checklists" ON public.daily_checklists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own checklists" ON public.daily_checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own checklists" ON public.daily_checklists FOR UPDATE USING (auth.uid() = user_id);

-- Workout Results
CREATE POLICY "Users can view own workout results" ON public.workout_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout results" ON public.workout_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Body Metrics
CREATE POLICY "Users can view own body metrics" ON public.body_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body metrics" ON public.body_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weekly XP Leaderboard
CREATE POLICY "Anyone can view leaderboard" ON public.weekly_xp_leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can insert own leaderboard entry" ON public.weekly_xp_leaderboard FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leaderboard entry" ON public.weekly_xp_leaderboard FOR UPDATE USING (auth.uid() = user_id);

-- Push Subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. STORAGE
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);
