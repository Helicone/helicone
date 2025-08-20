-- Create row policy for HQL user to only see data from their organization
-- This policy filters request_response_rmt table based on the organization_id
-- passed in the session context

-- Drop and recreate hql_user to ensure it exists
CREATE USER IF NOT EXISTS hql_user;

-- Drop existing row policy if it exists (for idempotency)
DROP ROW POLICY IF EXISTS hql_organization_filter ON request_response_rmt;

-- Create row policy that filters based on session setting
-- The getSetting function retrieves the organization_id from the session context
-- Only rows matching the current session's organization_id will be visible
-- Note: Custom settings must be prefixed with SQL_ in ClickHouse
CREATE ROW POLICY hql_organization_filter ON request_response_rmt
    FOR SELECT
    USING organization_id = getSetting('SQL_helicone_organization_id')
    TO hql_user;

-- Revoke system access from hql_user
REVOKE SELECT ON system.* FROM hql_user;
REVOKE SELECT ON information_schema.* FROM hql_user;
