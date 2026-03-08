
-- AI Coach Logs
CREATE TABLE public.ai_coach_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_type TEXT,
  ai_feedback TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Recommendations
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recommendation TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'workout',
  priority INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_coach_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see/insert their own data
CREATE POLICY "Users can view own coach logs" ON public.ai_coach_logs
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coach logs" ON public.ai_coach_logs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own recommendations" ON public.ai_recommendations
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations" ON public.ai_recommendations
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations" ON public.ai_recommendations
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ai_coach_logs_user ON public.ai_coach_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_recommendations_user ON public.ai_recommendations(user_id, type, created_at DESC);
