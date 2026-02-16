
-- Create function to notify on new chat message
CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_username TEXT;
BEGIN
  -- Don't notify if sender = receiver
  IF NEW.sender_id = NEW.receiver_id THEN RETURN NEW; END IF;
  
  SELECT username INTO sender_username FROM profiles WHERE user_id = NEW.sender_id;
  
  INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
  VALUES (
    NEW.receiver_id,
    'chat_message',
    'New message',
    '@' || sender_username || ': ' || LEFT(NEW.content, 50),
    NEW.sender_id,
    NEW.id::text
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on chat_messages
CREATE TRIGGER on_chat_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_chat_message();
