
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
