-- Check if we're in a deployment that supports HTTP extension
DO $$ BEGIN -- Try to create the HTTP extension if permissions allow
BEGIN CREATE EXTENSION IF NOT EXISTS http;
EXCEPTION
WHEN insufficient_privilege THEN RAISE NOTICE 'Skipping HTTP extension creation due to insufficient privileges. Tracking functionality will be disabled.';
END;
END $$;
-- Create system config table regardless of environment
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Default to disabled tracking
INSERT INTO public.system_config (key, value, description)
VALUES (
        'enable_tracking',
        'false',
        'Enable tracking of user signups'
    ) ON CONFLICT (key) DO NOTHING;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.system_config
FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.system_config
FROM authenticated;
CREATE POLICY "Allow postgres access to system_config" ON public.system_config FOR ALL TO postgres USING (true);
-- Create the tracking function only if HTTP extension exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'http'
) THEN -- Create tracking function since HTTP extension is available
CREATE OR REPLACE FUNCTION public.track_user_signup_to_posthog() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $function$
DECLARE posthog_key TEXT;
tracking_enabled TEXT;
response http_response;
BEGIN BEGIN
SELECT value INTO tracking_enabled
FROM public.system_config
WHERE key = 'enable_tracking';
IF tracking_enabled = 'true' THEN BEGIN
SELECT value INTO posthog_key
FROM public.system_config
WHERE key = 'posthog_public_key';
IF posthog_key IS NOT NULL
AND posthog_key != '' THEN
SELECT * INTO response
FROM http_post(
        'https://app.posthog.com/capture/',
        jsonb_build_object(
            'api_key',
            posthog_key,
            'event',
            'user_signed_up',
            'properties',
            jsonb_build_object(
                'distinct_id',
                NEW.id,
                'email',
                NEW.email,
                'source',
                'database_trigger',
                'timestamp',
                extract(
                    epoch
                    from now()
                ) * 1000
            )
        )::text,
        'application/json'
    );
END IF;
EXCEPTION
WHEN OTHERS THEN NULL;
END;
END IF;
EXCEPTION
WHEN OTHERS THEN NULL;
END;
RETURN NEW;
END;
$function$;
-- Create the trigger only if HTTP extension exists
CREATE TRIGGER track_user_signup_after_creation
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.track_user_signup_to_posthog();
RAISE NOTICE 'Tracking functionality enabled with HTTP extension';
ELSE RAISE NOTICE 'HTTP extension not available. Tracking functionality disabled.';
END IF;
END $$;