-- Create roles expected by Supabase migrations
-- Note: In a real Supabase env, these roles have specific permissions.
-- Here, we just create them so the migration scripts don't fail on "role does not exist".
CREATE ROLE anon NOINHERIT;
CREATE ROLE authenticated NOINHERIT;
CREATE ROLE service_role NOINHERIT;
-- Grant usage on the public schema to these roles so they can potentially be granted table permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
-- The 'postgres' role (our current user) likely needs to be able to grant permissions to these roles
GRANT anon TO postgres;
GRANT authenticated TO postgres;
GRANT service_role TO postgres;