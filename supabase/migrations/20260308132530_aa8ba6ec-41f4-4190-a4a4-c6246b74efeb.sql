
-- Groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'gym',
  privacy TEXT NOT NULL DEFAULT 'public',
  avatar_url TEXT,
  created_by UUID NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'approved',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group posts table
CREATE TABLE public.group_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group challenges table
CREATE TABLE public.group_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL,
  metric TEXT NOT NULL DEFAULT 'reps',
  duration_days INTEGER NOT NULL DEFAULT 30,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group challenge participants
CREATE TABLE public.group_challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.group_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Group messages table
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE user_id = _user_id AND group_id = _group_id AND status = 'approved'
  );
$$;

-- Helper function: check if user is admin of a group
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE user_id = _user_id AND group_id = _group_id AND role = 'admin' AND status = 'approved'
  );
$$;

-- GROUPS policies
CREATE POLICY "Authenticated can view public groups" ON public.groups
FOR SELECT TO authenticated
USING (privacy = 'public' OR public.is_group_member(auth.uid(), id));

CREATE POLICY "Authenticated can create groups" ON public.groups
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their groups" ON public.groups
FOR UPDATE TO authenticated
USING (public.is_group_admin(auth.uid(), id));

CREATE POLICY "Admins can delete their groups" ON public.groups
FOR DELETE TO authenticated
USING (public.is_group_admin(auth.uid(), id));

-- GROUP MEMBERS policies
CREATE POLICY "Members can view group members" ON public.group_members
FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id) OR user_id = auth.uid());

CREATE POLICY "Users can join groups" ON public.group_members
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update members" ON public.group_members
FOR UPDATE TO authenticated
USING (public.is_group_admin(auth.uid(), group_id) OR auth.uid() = user_id);

CREATE POLICY "Users can leave or admins can remove" ON public.group_members
FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_group_admin(auth.uid(), group_id));

-- GROUP POSTS policies
CREATE POLICY "Members can view group posts" ON public.group_posts
FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can create group posts" ON public.group_posts
FOR INSERT TO authenticated
WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = user_id);

CREATE POLICY "Users can delete own group posts" ON public.group_posts
FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_group_admin(auth.uid(), group_id));

-- GROUP CHALLENGES policies
CREATE POLICY "Members can view group challenges" ON public.group_challenges
FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Admins can create group challenges" ON public.group_challenges
FOR INSERT TO authenticated
WITH CHECK (public.is_group_admin(auth.uid(), group_id) AND auth.uid() = created_by);

CREATE POLICY "Admins can delete group challenges" ON public.group_challenges
FOR DELETE TO authenticated
USING (public.is_group_admin(auth.uid(), group_id));

-- GROUP CHALLENGE PARTICIPANTS policies
CREATE POLICY "Members can view challenge participants" ON public.group_challenge_participants
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM group_challenges gc
  WHERE gc.id = challenge_id AND public.is_group_member(auth.uid(), gc.group_id)
));

CREATE POLICY "Members can join challenges" ON public.group_challenge_participants
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM group_challenges gc
  WHERE gc.id = challenge_id AND public.is_group_member(auth.uid(), gc.group_id)
));

CREATE POLICY "Users can update own challenge progress" ON public.group_challenge_participants
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- GROUP MESSAGES policies
CREATE POLICY "Members can view group messages" ON public.group_messages
FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can send group messages" ON public.group_messages
FOR INSERT TO authenticated
WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON public.group_messages
FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_group_admin(auth.uid(), group_id));

-- Trigger to sync member count
CREATE OR REPLACE FUNCTION public.sync_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE groups SET member_count = GREATEST(0, member_count - 1) WHERE id = NEW.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_group_member_change
AFTER INSERT OR UPDATE OR DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.sync_group_member_count();

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Create indexes for performance
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_posts_group_id ON public.group_posts(group_id, created_at DESC);
CREATE INDEX idx_group_messages_group_id ON public.group_messages(group_id, created_at DESC);
CREATE INDEX idx_group_challenges_group_id ON public.group_challenges(group_id);
CREATE INDEX idx_groups_category ON public.groups(category);
CREATE INDEX idx_groups_privacy ON public.groups(privacy);
