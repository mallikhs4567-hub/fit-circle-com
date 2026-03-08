
-- Challenges table
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  exercise_type text NOT NULL,
  target_reps integer NOT NULL,
  duration_days integer NOT NULL DEFAULT 7,
  is_global boolean NOT NULL DEFAULT false,
  global_target integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz
);

-- Challenge participants
CREATE TABLE public.challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- RLS on challenges (public read)
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenges" ON public.challenges FOR SELECT TO authenticated USING (true);

-- RLS on challenge_participants
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view participants" ON public.challenge_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.challenge_participants FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_participants;

-- Function to update challenge progress from workout results
CREATE OR REPLACE FUNCTION public.update_challenge_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Find active challenges matching this exercise type
  FOR rec IN
    SELECT cp.id AS participant_id, cp.progress, c.target_reps, c.exercise_type
    FROM challenge_participants cp
    JOIN challenges c ON c.id = cp.challenge_id
    WHERE cp.user_id = NEW.user_id
      AND cp.completed = false
      AND LOWER(c.exercise_type) = LOWER(
        CASE
          WHEN NEW.exercise_name ILIKE '%push%' THEN 'pushups'
          WHEN NEW.exercise_name ILIKE '%squat%' THEN 'squats'
          WHEN NEW.exercise_name ILIKE '%sit%' OR NEW.exercise_name ILIKE '%crunch%' THEN 'situps'
          WHEN NEW.exercise_name ILIKE '%plank%' THEN 'plank'
          WHEN NEW.exercise_name ILIKE '%lunge%' THEN 'lunges'
          WHEN NEW.exercise_name ILIKE '%jump%' THEN 'jumping_jacks'
          WHEN NEW.exercise_name ILIKE '%knee%' THEN 'high_knees'
          WHEN NEW.exercise_name ILIKE '%dip%' THEN 'tricep_dips'
          WHEN NEW.exercise_name ILIKE '%dead%' THEN 'deadlifts'
          ELSE LOWER(REPLACE(NEW.exercise_name, ' ', '_'))
        END
      )
  LOOP
    UPDATE challenge_participants
    SET progress = LEAST(rec.progress + NEW.reps_completed, rec.target_reps),
        completed = (rec.progress + NEW.reps_completed >= rec.target_reps),
        completed_at = CASE WHEN rec.progress + NEW.reps_completed >= rec.target_reps THEN now() ELSE NULL END
    WHERE id = rec.participant_id;
  END LOOP;

  -- Update global challenges too
  FOR rec IN
    SELECT cp.id AS participant_id, cp.progress, c.target_reps
    FROM challenge_participants cp
    JOIN challenges c ON c.id = cp.challenge_id
    WHERE cp.user_id = NEW.user_id
      AND cp.completed = false
      AND c.is_global = true
  LOOP
    UPDATE challenge_participants
    SET progress = LEAST(rec.progress + NEW.reps_completed, rec.target_reps)
    WHERE id = rec.participant_id;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_workout_result_update_challenges
AFTER INSERT ON public.workout_results
FOR EACH ROW EXECUTE FUNCTION public.update_challenge_progress();

-- Seed challenges
INSERT INTO public.challenges (title, description, exercise_type, target_reps, duration_days, is_global, global_target) VALUES
('100 Pushups Challenge', 'Complete 100 pushups to prove your upper body strength', 'pushups', 100, 7, false, NULL),
('7 Day Squat Streak', 'Do squats every day for a week — 200 total reps', 'squats', 200, 7, false, NULL),
('500 Situps Challenge', 'Build core strength with 500 situps', 'situps', 500, 14, false, NULL),
('5 Minute Plank Challenge', 'Hold a plank for a total of 5 minutes (300 seconds counted as reps)', 'plank', 300, 7, false, NULL),
('Global 10,000 Pushups', 'The entire community contributes to reach 10,000 pushups!', 'pushups', 10000, 30, true, 10000);
