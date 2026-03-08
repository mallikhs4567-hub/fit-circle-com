
-- Tighten INSERT policy to only allow own user_id
DROP POLICY "System can insert activities" ON public.activities;
CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
