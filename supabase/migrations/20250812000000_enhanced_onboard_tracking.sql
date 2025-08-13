DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'http'
) THEN

CREATE OR REPLACE FUNCTION public.track_organization_events() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE 
    posthog_key TEXT;
    tracking_enabled TEXT;
    org_owner_email TEXT;
    org_owner_name TEXT;
    response http_response;
    old_onboarding_status JSONB;
    new_onboarding_status JSONB;
    old_has_completed_quickstart BOOLEAN;
    new_has_completed_quickstart BOOLEAN;
BEGIN
    SELECT value INTO tracking_enabled
    FROM public.system_config
    WHERE key = 'enable_tracking';
    
    IF tracking_enabled = 'true' THEN
        SELECT value INTO posthog_key
        FROM public.system_config
        WHERE key = 'posthog_public_key';
        
        IF posthog_key IS NOT NULL AND posthog_key != '' THEN
            SELECT email,
                COALESCE(
                    raw_user_meta_data->>'full_name',
                    raw_user_meta_data->>'name',
                    ''
                ) INTO org_owner_email,
                org_owner_name
            FROM auth.users
            WHERE id = NEW.owner;
            old_onboarding_status := COALESCE(OLD.onboarding_status, '{}'::jsonb);
            new_onboarding_status := COALESCE(NEW.onboarding_status, '{}'::jsonb);
            old_has_completed_quickstart := COALESCE((old_onboarding_status->>'hasCompletedQuickstart')::boolean, false);
            new_has_completed_quickstart := COALESCE((new_onboarding_status->>'hasCompletedQuickstart')::boolean, false);
            
            BEGIN
                IF (
                    OLD.has_onboarded = false
                    AND NEW.has_onboarded = true
                    AND NEW.tier != 'demo'
                ) THEN
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
                                'organization_id',
                                NEW.id,
                                'organization_name',
                                NEW.name,
                                'organization_tier',
                                NEW.tier,
                                'timestamp',
                                extract(epoch from now()) * 1000,
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
                IF (
                    OLD.has_integrated = false
                    AND NEW.has_integrated = true
                    AND NEW.tier != 'demo'
                ) THEN
                    SELECT * INTO response
                    FROM http_post(
                        'https://app.posthog.com/capture/',
                        jsonb_build_object(
                            'api_key',
                            posthog_key,
                            'event',
                            'organization_integrated',
                            'distinct_id',
                            NEW.owner,
                            'properties',
                            jsonb_build_object(
                                'email',
                                org_owner_email,
                                'name',
                                org_owner_name,
                                'organization_id',
                                NEW.id,
                                'organization_name',
                                NEW.name,
                                'organization_tier',
                                NEW.tier,
                                'timestamp',
                                extract(epoch from now()) * 1000,
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
                IF (
                    old_has_completed_quickstart = false
                    AND new_has_completed_quickstart = true
                    AND NEW.tier != 'demo'
                ) THEN
                    SELECT * INTO response
                    FROM http_post(
                        'https://app.posthog.com/capture/',
                        jsonb_build_object(
                            'api_key',
                            posthog_key,
                            'event',
                            'organization_quickstart_completed',
                            'distinct_id',
                            NEW.owner,
                            'properties',
                            jsonb_build_object(
                                'email',
                                org_owner_email,
                                'name',
                                org_owner_name,
                                'organization_id',
                                NEW.id,
                                'organization_name',
                                NEW.name,
                                'organization_tier',
                                NEW.tier,
                                'timestamp',
                                extract(epoch from now()) * 1000,
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
CREATE OR REPLACE TRIGGER track_organization_events_trigger
    AFTER UPDATE ON public.organization 
    FOR EACH ROW 
    EXECUTE FUNCTION public.track_organization_events();

RAISE NOTICE 'Enhanced organization tracking enabled with HTTP extension (onboarding, integration, quickstart)';

ELSE 
    RAISE NOTICE 'HTTP extension not available. Enhanced organization tracking disabled.';
END IF;
END $$; 