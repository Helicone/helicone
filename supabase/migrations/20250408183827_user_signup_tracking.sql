CREATE EXTENSION IF NOT EXISTS http;
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.system_config (key, value, description)
VALUES (
        'enable_tracking',
        'false',
        'Enable tracking of user signups'
    ) ON CONFLICT (key) DO NOTHING;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow postgres access to system_config" ON public.system_config FOR ALL TO postgres USING (true);
CREATE OR REPLACE FUNCTION public.track_user_signup_to_posthog() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
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
$$;
CREATE TRIGGER track_user_signup_after_creation
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.track_user_signup_to_posthog();