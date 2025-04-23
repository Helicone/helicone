ALTER TABLE public.organization
ADD COLUMN onboarding_status jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.organization
ADD COLUMN is_main_org BOOLEAN NOT NULL DEFAULT false;
-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.create_default_orgs_for_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE main_org_id UUID;
demo_org_id UUID;
BEGIN -- Create the main organization (first non-demo org)
INSERT INTO public.organization (
        name,
        owner,
        tier,
        is_personal,
        has_onboarded,
        soft_delete,
        onboarding_status,
        is_main_org
    )
VALUES (
        'My Organization',
        NEW.id,
        'free',
        true,
        false,
        false,
        jsonb_build_object(
            'hasOnboarded',
            false,
            'selectedTier',
            'free',
            'currentStep',
            'ORGANIZATION',
            'members',
            jsonb_build_array()
        ),
        true
    )
RETURNING id INTO main_org_id;
-- Add the user as an owner in the organization_member table for the main org
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
-- Create the demo organization
INSERT INTO public.organization (
        name,
        owner,
        tier,
        is_personal,
        has_onboarded,
        soft_delete,
        onboarding_status
    )
VALUES (
        'Demo Org',
        NEW.id,
        'demo',
        true,
        true,
        false,
        jsonb_build_object(
            'hasOnboarded',
            true,
            'demoDataSetup',
            false
        )
    )
RETURNING id INTO demo_org_id;
-- Add the user as an owner in the organization_member table for the demo org
INSERT INTO public.organization_member (
        member,
        organization,
        org_role
    )
VALUES (
        NEW.id,
        demo_org_id,
        'owner'
    );
RETURN NEW;
END;
$$;
-- Create the trigger on auth.users
CREATE TRIGGER create_default_orgs_after_user_creation
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_default_orgs_for_new_user();