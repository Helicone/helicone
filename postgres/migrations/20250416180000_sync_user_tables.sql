-- Migration to synchronize public.user changes to the simplified auth.users table
-- Function to handle INSERT on public.user (DEBUG: Inserting only ID)
CREATE OR REPLACE FUNCTION public.sync_public_user_to_auth_insert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    auth -- Ensure auth schema is searched
    AS $$ BEGIN -- DEBUGGING: Try inserting only the ID to isolate the error
INSERT INTO auth.users (
        id -- Mapped from public.user.auth_user_id
    )
VALUES (
        NEW.auth_user_id -- Use auth_user_id from public.user as the id in auth.users
    );
-- The other columns (email, created_at, last_sign_in_at) will get their default (NULL or now() for created_at)
RETURN NEW;
END;
$$;
-- Function to handle UPDATE on public.user (Keep simplified version)
CREATE OR REPLACE FUNCTION public.sync_public_user_to_auth_update() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    auth -- Ensure auth schema is searched
    AS $$ BEGIN -- Only update if email changed
    IF OLD.email IS DISTINCT
FROM NEW.email THEN
UPDATE auth.users
SET email = NEW.email -- Potentially update last_sign_in_at here if needed, e.g.:
    -- , last_sign_in_at = now()
WHERE id = NEW.auth_user_id;
-- Match using auth_user_id
END IF;
RETURN NEW;
END;
$$;
-- Function to handle DELETE on public.user
CREATE OR REPLACE FUNCTION public.sync_public_user_to_auth_delete() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    auth -- Ensure auth schema is searched
    AS $$ BEGIN
DELETE FROM auth.users
WHERE id = OLD.auth_user_id;
-- Match using auth_user_id
RETURN OLD;
END;
$$;
-- Create the triggers
CREATE TRIGGER trigger_sync_public_user_to_auth_insert
AFTER
INSERT ON public.user FOR EACH ROW EXECUTE FUNCTION public.sync_public_user_to_auth_insert();
CREATE TRIGGER trigger_sync_public_user_to_auth_update
AFTER
UPDATE ON public.user FOR EACH ROW EXECUTE FUNCTION public.sync_public_user_to_auth_update();
CREATE TRIGGER trigger_sync_public_user_to_auth_delete
AFTER DELETE ON public.user FOR EACH ROW EXECUTE FUNCTION public.sync_public_user_to_auth_delete();

