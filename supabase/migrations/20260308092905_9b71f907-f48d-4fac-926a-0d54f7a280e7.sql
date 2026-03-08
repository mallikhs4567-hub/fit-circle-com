
-- Award XP when a challenge is completed
CREATE OR REPLACE FUNCTION public.reward_challenge_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  ctarget integer;
  xp_reward integer;
BEGIN
  -- Only trigger when completed changes from false to true
  IF OLD.completed = false AND NEW.completed = true THEN
    -- Get target reps to calculate XP reward
    SELECT target_reps INTO ctarget FROM challenges WHERE id = NEW.challenge_id;
    
    -- XP reward: base 50 + 1 per target rep (capped at 200)
    xp_reward := LEAST(50 + ctarget, 200);
    
    -- Award XP using existing function
    PERFORM award_xp(NEW.user_id, xp_reward);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reward_challenge_completion
  AFTER UPDATE ON public.challenge_participants
  FOR EACH ROW EXECUTE FUNCTION public.reward_challenge_completion();
