
-- Store AI workout session results
CREATE TABLE public.workout_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  reps_completed INTEGER NOT NULL DEFAULT 0,
  avg_form_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout results" ON public.workout_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout results" ON public.workout_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_workout_results_user ON public.workout_results(user_id, created_at DESC);

-- Store body metrics over time
CREATE TABLE public.body_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shoulder_width_ratio NUMERIC(5,3),
  waist_ratio NUMERIC(5,3),
  posture_score NUMERIC(5,2),
  weight NUMERIC(5,1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own body metrics" ON public.body_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body metrics" ON public.body_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_body_metrics_user ON public.body_metrics(user_id, created_at DESC);
