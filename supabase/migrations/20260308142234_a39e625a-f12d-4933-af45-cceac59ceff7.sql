-- Tighten the insert policy: users can only create referrals where they are the inviter
DROP POLICY IF EXISTS "Authenticated users can insert referrals" ON public.referrals;
CREATE POLICY "Users can insert own referrals"
  ON public.referrals FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = auth.uid());