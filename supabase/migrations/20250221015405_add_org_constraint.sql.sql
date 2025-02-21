CREATE OR REPLACE FUNCTION create_main_org(user_id UUID)
RETURNS TABLE (organization_id UUID) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO organization (name, owner, tier, is_personal, has_onboarded, soft_delete)
    VALUES ('My Organization', user_id, 'free', true, false, false)
    RETURNING organization.id as organization_id;
END;
$$ LANGUAGE plpgsql;