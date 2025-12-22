CREATE OR REPLACE FUNCTION public.create_default_orgs_for_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  main_org_id UUID;
  sso_org_id UUID;
  user_domain TEXT;
BEGIN
  IF NEW.email IS NOT NULL THEN
    user_domain := lower(split_part(NEW.email, '@', 2));
  END IF;

  IF user_domain IS NOT NULL AND user_domain <> '' THEN
    SELECT organization_id
      INTO sso_org_id
      FROM public.organization_sso_config
     WHERE domain = user_domain
       AND enabled = true
     LIMIT 1;
  END IF;

  IF sso_org_id IS NOT NULL THEN
    INSERT INTO public.organization_member (
        member,
        organization,
        org_role
      )
      VALUES (
        NEW.id,
        sso_org_id,
        'member'
      )
      ON CONFLICT (member, organization) DO NOTHING;

    RETURN NEW;
  END IF;

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
