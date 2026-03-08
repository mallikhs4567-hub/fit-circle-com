
-- Wearable devices
CREATE TABLE public.wearable_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Wearable activity data
CREATE TABLE public.wearable_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.wearable_devices(id) ON DELETE CASCADE,
  steps INTEGER DEFAULT 0,
  calories INTEGER DEFAULT 0,
  heart_rate INTEGER,
  distance NUMERIC DEFAULT 0,
  sleep_minutes INTEGER,
  workout_type TEXT,
  workout_duration_minutes INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wearable_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own devices" ON public.wearable_devices
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" ON public.wearable_devices
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" ON public.wearable_devices
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" ON public.wearable_devices
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity" ON public.wearable_activity
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON public.wearable_activity
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_wearable_devices_user ON public.wearable_devices(user_id);
CREATE INDEX idx_wearable_activity_user_date ON public.wearable_activity(user_id, recorded_at DESC);
CREATE INDEX idx_wearable_activity_device ON public.wearable_activity(device_id);
