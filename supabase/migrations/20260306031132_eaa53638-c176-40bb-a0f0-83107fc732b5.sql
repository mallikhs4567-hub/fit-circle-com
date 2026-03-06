-- Fix 2: Restrict chat message updates to only read_at field
-- Use a trigger to prevent content/sender/receiver modification

CREATE OR REPLACE FUNCTION public.protect_chat_message_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow read_at to be changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    RAISE EXCEPTION 'Cannot modify message content';
  END IF;
  IF OLD.sender_id IS DISTINCT FROM NEW.sender_id THEN
    RAISE EXCEPTION 'Cannot modify sender_id';
  END IF;
  IF OLD.receiver_id IS DISTINCT FROM NEW.receiver_id THEN
    RAISE EXCEPTION 'Cannot modify receiver_id';
  END IF;
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER protect_chat_message_integrity
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.protect_chat_message_fields();