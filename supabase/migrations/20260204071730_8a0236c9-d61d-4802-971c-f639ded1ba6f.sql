-- Drop existing policy for viewing friends profiles
DROP POLICY IF EXISTS "Users can view friends profiles" ON public.profiles;

-- Create updated policy that includes pending friend requests
CREATE POLICY "Users can view related profiles"
ON public.profiles
FOR SELECT
USING (
  -- Own profile
  auth.uid() = user_id
  OR
  -- Accepted friends
  EXISTS (
    SELECT 1 FROM friendships
    WHERE friendships.status = 'accepted'
    AND (
      (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.user_id)
    )
  )
  OR
  -- Pending friend requests (either direction) - so you can see who sent you a request or who you sent to
  EXISTS (
    SELECT 1 FROM friendships
    WHERE friendships.status = 'pending'
    AND (
      (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.user_id)
    )
  )
);

-- Drop and recreate the own profile policy to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;