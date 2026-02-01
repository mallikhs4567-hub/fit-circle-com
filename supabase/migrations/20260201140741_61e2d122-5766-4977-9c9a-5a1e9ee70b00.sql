-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view posts from friends or self" ON public.posts;

-- Create new policy that allows all authenticated users to view all posts
CREATE POLICY "All authenticated users can view posts"
ON public.posts
FOR SELECT
TO authenticated
USING (true);