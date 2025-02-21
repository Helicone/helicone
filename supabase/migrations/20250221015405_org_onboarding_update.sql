CREATE OR REPLACE FUNCTION create_main_org(user_id UUID)
RETURNS TABLE (organization_id UUID) AS $$
BEGIN
    IF (SELECT COUNT(*) FROM organization o WHERE o.owner = user_id AND o.tier = 'free' AND o.name = 'My Organization') >= 1 THEN
        RAISE EXCEPTION 'User can only have one free organization';
    ELSE
        RETURN QUERY
        INSERT INTO organization (name, owner, tier, is_personal, has_onboarded, soft_delete)
        VALUES ('My Organization', user_id, 'free', true, false, false)
        RETURNING organization.id as organization_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.organization
ADD COLUMN onboarding_status jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION ensure_one_demo_org(user_id UUID)
RETURNS TABLE (organization_id UUID) AS $$
BEGIN
    IF (SELECT COUNT(*) FROM organization o WHERE o.owner = user_id AND o.tier = 'demo') >= 1 THEN
        RAISE EXCEPTION 'User can only have one demo organization';
    ELSE
        RETURN QUERY
        INSERT INTO organization (name, owner, tier, is_personal, has_onboarded, soft_delete)
        VALUES ('Demo Org', user_id, 'demo', true, true, false)
        RETURNING organization.id as organization_id;
    END IF;
END;
$$ LANGUAGE plpgsql;