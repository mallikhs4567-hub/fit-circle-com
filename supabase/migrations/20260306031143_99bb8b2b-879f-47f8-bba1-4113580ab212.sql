-- Fix 3: Protect gamification fields (xp, streak, total_active_days) from direct user updates

CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent direct updates to protected gamification fields
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_gamification_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW 
WHEN (current_setting('role') != 'service_role')
EXECUTE FUNCTION public.validate_profile_update();