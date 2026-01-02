-- Add foreign key from posts.user_id to profiles.user_id
ALTER TABLE public.posts 
ADD CONSTRAINT posts_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);