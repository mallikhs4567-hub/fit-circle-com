
-- Fix overly permissive INSERT policy on notifications
-- Only allow inserts from authenticated users (triggers use SECURITY DEFINER so they bypass RLS)
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Only system can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);
