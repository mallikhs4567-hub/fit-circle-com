-- Fix 4: Add trigger to auto-sync post reaction counts from post_reactions table
-- This removes the need for client-side UPDATE on posts table

CREATE OR REPLACE FUNCTION public.sync_post_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
  counts JSONB;
BEGIN
  SELECT jsonb_build_object(
    'heart', COUNT(*) FILTER (WHERE reaction_type = 'heart'),
    'fire', COUNT(*) FILTER (WHERE reaction_type = 'fire'),
    'clap', COUNT(*) FILTER (WHERE reaction_type = 'clap')
  ) INTO counts
  FROM post_reactions
  WHERE post_id = COALESCE(NEW.post_id, OLD.post_id);
  
  UPDATE posts SET reactions = counts
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER maintain_post_reaction_counts
AFTER INSERT OR DELETE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.sync_post_reaction_counts();