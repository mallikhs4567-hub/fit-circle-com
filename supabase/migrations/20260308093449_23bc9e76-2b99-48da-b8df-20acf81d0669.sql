
-- 1. Notify friends when someone completes a challenge
CREATE OR REPLACE FUNCTION public.notify_friends_challenge_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  uname text;
  ctitle text;
  friend_row RECORD;
BEGIN
  IF OLD.completed = false AND NEW.completed = true THEN
    SELECT username INTO uname FROM profiles WHERE user_id = NEW.user_id;
    SELECT title INTO ctitle FROM challenges WHERE id = NEW.challenge_id;

    FOR friend_row IN
      SELECT CASE WHEN user_id = NEW.user_id THEN friend_id ELSE user_id END AS fid
      FROM friendships
      WHERE status = 'accepted' AND (user_id = NEW.user_id OR friend_id = NEW.user_id)
    LOOP
      INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
      VALUES (
        friend_row.fid,
        'challenge_completed',
        'Challenge Completed! 🏆',
        '@' || uname || ' completed the ' || ctitle,
        NEW.user_id,
        NEW.challenge_id::text
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_friends_challenge_complete
  AFTER UPDATE ON public.challenge_participants
  FOR EACH ROW EXECUTE FUNCTION public.notify_friends_challenge_complete();

-- 2. Notify when a friend overtakes your progress on a challenge
CREATE OR REPLACE FUNCTION public.notify_progress_overtaken()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  uname text;
  ctitle text;
  overtaken RECORD;
BEGIN
  IF NEW.progress <= OLD.progress OR NEW.completed = true THEN RETURN NEW; END IF;

  SELECT username INTO uname FROM profiles WHERE user_id = NEW.user_id;
  SELECT title INTO ctitle FROM challenges WHERE id = NEW.challenge_id;

  FOR overtaken IN
    SELECT cp.user_id AS victim_id
    FROM challenge_participants cp
    JOIN friendships f ON f.status = 'accepted'
      AND ((f.user_id = NEW.user_id AND f.friend_id = cp.user_id)
        OR (f.friend_id = NEW.user_id AND f.user_id = cp.user_id))
    WHERE cp.challenge_id = NEW.challenge_id
      AND cp.user_id != NEW.user_id
      AND cp.progress < NEW.progress
      AND cp.progress >= OLD.progress
  LOOP
    INSERT INTO notifications (user_id, type, title, body, from_user_id, reference_id)
    VALUES (
      overtaken.victim_id,
      'leaderboard_overtaken',
      'You got overtaken! 🔥',
      '@' || uname || ' passed you in ' || ctitle,
      NEW.user_id,
      NEW.challenge_id::text
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_progress_overtaken
  AFTER UPDATE ON public.challenge_participants
  FOR EACH ROW EXECUTE FUNCTION public.notify_progress_overtaken();

-- 3. Notify all users when a new challenge is created
CREATE OR REPLACE FUNCTION public.notify_new_challenge()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  profile_row RECORD;
BEGIN
  FOR profile_row IN SELECT user_id FROM profiles LOOP
    INSERT INTO notifications (user_id, type, title, body, reference_id)
    VALUES (
      profile_row.user_id,
      'new_challenge',
      'New Challenge Available! 🎯',
      NEW.title || ' — ' || NEW.target_reps || ' ' || NEW.exercise_type || ' challenge just dropped!',
      NEW.id::text
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_challenge
  AFTER INSERT ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_challenge();
