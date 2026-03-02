
-- Add xp column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;

-- Weekly XP leaderboard table
CREATE TABLE IF NOT EXISTS public.weekly_xp_leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_xp_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard" ON public.weekly_xp_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own leaderboard entry" ON public.weekly_xp_leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entry" ON public.weekly_xp_leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

-- DB function to award XP atomically
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer)
RETURNS TABLE(new_xp integer, new_level integer, leveled_up boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  old_xp integer;
  updated_xp integer;
  old_level integer;
  cur_level integer;
  week_start_date date;
BEGIN
  -- Get current XP
  SELECT COALESCE(xp, 0) INTO old_xp FROM profiles WHERE profiles.user_id = p_user_id;
  old_level := old_xp / 100 + 1;
  
  -- Update profile XP
  UPDATE profiles SET xp = COALESCE(xp, 0) + p_amount WHERE profiles.user_id = p_user_id
  RETURNING xp INTO updated_xp;
  
  cur_level := updated_xp / 100 + 1;
  
  -- Update weekly leaderboard
  week_start_date := date_trunc('week', now())::date;
  INSERT INTO weekly_xp_leaderboard (user_id, week_start, xp)
  VALUES (p_user_id, week_start_date, p_amount)
  ON CONFLICT (user_id, week_start) DO UPDATE SET xp = weekly_xp_leaderboard.xp + p_amount;
  
  RETURN QUERY SELECT updated_xp, cur_level, (cur_level > old_level);
END;
$$;
