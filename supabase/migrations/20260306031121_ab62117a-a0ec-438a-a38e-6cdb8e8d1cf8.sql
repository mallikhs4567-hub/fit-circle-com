-- Fix 1: Sanitize username in handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_username TEXT;
BEGIN
  -- Extract and sanitize username
  clean_username := COALESCE(
    trim(new.raw_user_meta_data ->> 'username'),
    'user_' || substr(new.id::text, 1, 8)
  );
  
  -- Validate username: alphanumeric and underscore only, 3-30 chars
  IF NOT clean_username ~ '^[a-zA-Z0-9_]{3,30}$' THEN
    clean_username := 'user_' || substr(new.id::text, 1, 8);
  END IF;
  
  -- Handle uniqueness conflicts
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = clean_username) LOOP
    clean_username := clean_username || '_' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;
  
  INSERT INTO public.profiles (user_id, username, email)
  VALUES (new.id, clean_username, new.email);
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO public.profiles (user_id, username, email)
    VALUES (new.id, 'user_' || substr(new.id::text, 1, 8), new.email);
    RETURN new;
END;
$$;