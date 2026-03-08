-- Add referral_code column to profiles for unique invite codes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Generate referral codes for existing users
UPDATE public.profiles 
SET referral_code = UPPER(SUBSTR(md5(user_id::text || 'fitcircle'), 1, 8))
WHERE referral_code IS NULL;

-- Create trigger to auto-generate referral codes for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTR(md5(NEW.user_id::text || 'fitcircle'), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Add referred_by column to profiles  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;

-- Function to process referral reward: grant 7-day premium trial
CREATE OR REPLACE FUNCTION public.process_referral_reward(inviter_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  completed_count integer;
BEGIN
  SELECT COUNT(*) INTO completed_count
  FROM referrals
  WHERE inviter_id = inviter_user_id AND status = 'completed';

  IF completed_count >= 3 AND completed_count % 3 = 0 THEN
    INSERT INTO subscriptions (user_id, plan_type, payment_provider, payment_id, amount, currency, status, start_date, end_date)
    VALUES (
      inviter_user_id,
      'premium',
      'referral',
      'referral_reward_' || completed_count,
      0,
      'INR',
      'active',
      now()::text,
      (now() + interval '7 days')::text
    );
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- Update referral status when referred user creates profile
CREATE OR REPLACE FUNCTION public.complete_referral_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE referrals SET status = 'completed'
  WHERE new_user_id = NEW.user_id AND status = 'pending';

  PERFORM process_referral_reward(r.inviter_id)
  FROM referrals r WHERE r.new_user_id = NEW.user_id AND r.status = 'completed';

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_complete_referral
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.complete_referral_on_profile();

-- RLS policies for referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals as inviter"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (inviter_id = auth.uid());

CREATE POLICY "Authenticated users can insert referrals"
  ON public.referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);