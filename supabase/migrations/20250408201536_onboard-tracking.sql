-- Create the tracking function only if HTTP extension exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'http'
) THEN -- Create tracking function since HTTP extension is available
CREATE OR REPLACE FUNCTION public.track_organization_onboarding() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE posthog_key TEXT;
tracking_enabled TEXT;
org_owner_email TEXT;
org_owner_name TEXT;
response http_response;
BEGIN IF (
    OLD.has_onboarded = false
    AND NEW.has_onboarded = true
    AND NEW.tier != 'demo'
) THEN
SELECT value INTO tracking_enabled
FROM public.system_config
WHERE key = 'enable_tracking';
IF tracking_enabled = 'true' THEN BEGIN
SELECT email,
    COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        ''
    ) INTO org_owner_email,
    org_owner_name
FROM auth.users
WHERE id = NEW.owner;
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
            'organization_onboarded',
            'distinct_id',
            NEW.owner,
            'properties',
            jsonb_build_object(
                'email',
                org_owner_email,
                'name',
                org_owner_name,
                'timestamp',
                extract(
                    epoch
                    from now()
                ) * 1000,
                '$groups',
                jsonb_build_object(
                    'organization',
                    NEW.id
                )
            )
        )::text,
        'application/json'
    );
END IF;
EXCEPTION
WHEN OTHERS THEN NULL;
END;
END IF;
END IF;
RETURN NEW;
END;
$function$;
-- Create the trigger only if HTTP extension exists
CREATE TRIGGER track_organization_onboarding_trigger
AFTER
UPDATE ON public.organization FOR EACH ROW EXECUTE FUNCTION public.track_organization_onboarding();
RAISE NOTICE 'Organization onboarding tracking enabled with HTTP extension';
ELSE RAISE NOTICE 'HTTP extension not available. Organization onboarding tracking disabled.';
END IF;
END $$;