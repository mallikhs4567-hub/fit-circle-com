
-- Activities table for the social feed
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Everyone can read activities
CREATE POLICY "Anyone can view activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (true);

-- Only system (triggers) inserts, but allow user insert for safety
CREATE POLICY "System can insert activities"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

-- Trigger: workout completed
CREATE OR REPLACE FUNCTION public.activity_on_workout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  uname text;
BEGIN
  SELECT username INTO uname FROM profiles WHERE user_id = NEW.user_id;
  INSERT INTO activities (user_id, type, description, metadata)
  VALUES (
    NEW.user_id,
    'workout_completed',
    uname || ' completed ' || NEW.reps_completed || ' ' || NEW.exercise_name || ' 💪',
    jsonb_build_object('exercise', NEW.exercise_name, 'reps', NEW.reps_completed, 'xp', NEW.xp_earned)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_workout
  AFTER INSERT ON public.workout_results
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_workout();

-- Trigger: joined challenge
CREATE OR REPLACE FUNCTION public.activity_on_challenge_join()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  uname text;
  ctitle text;
BEGIN
  SELECT username INTO uname FROM profiles WHERE user_id = NEW.user_id;
  SELECT title INTO ctitle FROM challenges WHERE id = NEW.challenge_id;
  INSERT INTO activities (user_id, type, description, metadata)
  VALUES (
    NEW.user_id,
    'challenge_joined',
    uname || ' joined the ' || ctitle || ' 🎯',
    jsonb_build_object('challenge_id', NEW.challenge_id, 'challenge_title', ctitle)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_challenge_join
  AFTER INSERT ON public.challenge_participants
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_challenge_join();

-- Trigger: completed challenge
CREATE OR REPLACE FUNCTION public.activity_on_challenge_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  uname text;
  ctitle text;
BEGIN
  IF OLD.completed = false AND NEW.completed = true THEN
    SELECT username INTO uname FROM profiles WHERE user_id = NEW.user_id;
    SELECT title INTO ctitle FROM challenges WHERE id = NEW.challenge_id;
    INSERT INTO activities (user_id, type, description, metadata)
    VALUES (
      NEW.user_id,
      'challenge_completed',
      uname || ' completed the ' || ctitle || ' 🏆',
      jsonb_build_object('challenge_id', NEW.challenge_id, 'challenge_title', ctitle)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_challenge_complete
  AFTER UPDATE ON public.challenge_participants
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_challenge_complete();

-- Trigger: streak milestone (every 5 days)
CREATE OR REPLACE FUNCTION public.activity_on_streak()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.streak IS NOT NULL AND OLD.streak IS NOT NULL
     AND NEW.streak > OLD.streak
     AND NEW.streak % 5 = 0 THEN
    INSERT INTO activities (user_id, type, description, metadata)
    VALUES (
      NEW.user_id,
      'streak_achieved',
      NEW.username || ' achieved a ' || NEW.streak || ' Day Streak 🔥',
      jsonb_build_object('streak', NEW.streak)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_streak
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.activity_on_streak();
