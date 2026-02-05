-- Function to delete chat for a specific user (marks messages as deleted for them)
CREATE OR REPLACE FUNCTION public.delete_chat_for_user(other_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Mark all messages in this conversation as deleted for the current user
    UPDATE public.chat_messages
    SET deleted_for = deleted_for || to_jsonb(auth.uid()::text)
    WHERE 
        (sender_id = auth.uid() AND receiver_id = other_user_id)
        OR (sender_id = other_user_id AND receiver_id = auth.uid());
END;
$$;