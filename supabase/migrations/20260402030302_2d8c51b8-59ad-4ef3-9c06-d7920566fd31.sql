
-- Fix validate_profile_update to allow award_xp bypass
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow bypass from award_xp function
  IF current_setting('app.award_xp_bypass', true) = 'true' THEN
    RETURN NEW;
  END IF;
  IF OLD.xp IS DISTINCT FROM NEW.xp THEN
    RAISE EXCEPTION 'xp can only be modified via award_xp function';
  END IF;
  IF OLD.streak IS DISTINCT FROM NEW.streak THEN
    RAISE EXCEPTION 'streak can only be modified via system functions';
  END IF;
  IF OLD.total_active_days IS DISTINCT FROM NEW.total_active_days THEN
    RAISE EXCEPTION 'total_active_days can only be modified via system functions';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix award_xp to set bypass flag
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer)
RETURNS TABLE(new_xp integer, new_level integer, leveled_up boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_xp integer;
  updated_xp integer;
  old_level integer;
  cur_level integer;
  week_start_date date;
BEGIN
  -- Set bypass flag for validate_profile_update trigger
  PERFORM set_config('app.award_xp_bypass', 'true', true);
  
  SELECT COALESCE(p.xp, 0) INTO old_xp FROM profiles p WHERE p.user_id = p_user_id;
  old_level := old_xp / 100 + 1;
  
  UPDATE profiles SET xp = COALESCE(profiles.xp, 0) + p_amount WHERE profiles.user_id = p_user_id
  RETURNING profiles.xp INTO updated_xp;
  
  cur_level := updated_xp / 100 + 1;
  
  -- Reset bypass flag
  PERFORM set_config('app.award_xp_bypass', 'false', true);
  
  week_start_date := date_trunc('week', now())::date;
  INSERT INTO weekly_xp_leaderboard (user_id, week_start, xp)
  VALUES (p_user_id, week_start_date, p_amount)
  ON CONFLICT (user_id, week_start) DO UPDATE SET xp = weekly_xp_leaderboard.xp + p_amount;
  
  RETURN QUERY SELECT updated_xp, cur_level, (cur_level > old_level);
END;
$$;

-- Now fix inconsistent data
UPDATE challenge_participants cp
SET completed = true,
    completed_at = COALESCE(cp.completed_at, now())
FROM challenges c
WHERE cp.challenge_id = c.id
  AND cp.progress >= c.target_reps
  AND cp.completed = false;
