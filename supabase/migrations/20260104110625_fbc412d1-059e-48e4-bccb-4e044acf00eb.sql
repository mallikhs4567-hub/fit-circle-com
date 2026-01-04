-- Fix: Restrict profile visibility to protect sensitive data (emails, health data)

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Policy 1: Users can view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can view friends' profiles (for social features)
CREATE POLICY "Users can view friends profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.user_id) OR
      (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.user_id)
    )
  )
);

-- Create a security definer function for username search (friend discovery)
-- This allows searching by username without exposing full profile data
CREATE OR REPLACE FUNCTION public.search_users_by_username(search_username TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  streak INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.avatar_url,
    p.streak
  FROM profiles p
  WHERE LOWER(p.username) LIKE LOWER('%' || search_username || '%')
  LIMIT 20;
$$;