-- Create a function to ensure only one demo organization per user
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