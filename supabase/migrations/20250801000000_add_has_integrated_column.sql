-- Add has_integrated column to organization table
ALTER TABLE public.organization
ADD COLUMN has_integrated BOOLEAN NOT NULL DEFAULT true;

-- Create or replace the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.create_default_orgs_for_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE main_org_id UUID;
BEGIN 
    INSERT INTO public.organization (
        name,
        owner,
        tier,
        is_personal,
        has_onboarded,
        soft_delete,
        onboarding_status,
        is_main_org,
        has_integrated
    )
    VALUES (
        'My Organization',
        NEW.id,
        'enterprise',
        true,
        false,
        false,
        jsonb_build_object(
            'hasOnboarded',
            false,
            'selectedTier',
            'enterprise',
            'currentStep',
            'ORGANIZATION',
            'members',
            jsonb_build_array()
        ),
        true,
        false
    )
    RETURNING id INTO main_org_id;

    INSERT INTO public.organization_member (
        member,
        organization,
        org_role
    )
    VALUES (
        NEW.id,
        main_org_id,
        'owner'
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_default_orgs_after_user_creation ON auth.users;

CREATE TRIGGER create_default_orgs_after_user_creation
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_default_orgs_for_new_user(); 