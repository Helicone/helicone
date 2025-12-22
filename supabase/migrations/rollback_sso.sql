-- ROLLBACK SCRIPT FOR SSO MIGRATIONS
-- Run this to completely remove SSO feature from the database

-- 1. Drop the trigger first
DROP TRIGGER IF EXISTS update_organization_sso_config_updated_at ON public.organization_sso_config;

-- 2. Drop the function
DROP FUNCTION IF EXISTS public.update_organization_sso_config_updated_at();

-- 3. Drop the table (this also removes indexes and constraints)
DROP TABLE IF EXISTS public.organization_sso_config;

-- 4. Restore the original create_default_orgs_for_new_user function (without SSO check)
CREATE OR REPLACE FUNCTION public.create_default_orgs_for_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  main_org_id UUID;
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
        jsonb_build_array(),
        'hasCompletedQuickstart',
        false
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

-- Done! SSO has been removed from the database.
