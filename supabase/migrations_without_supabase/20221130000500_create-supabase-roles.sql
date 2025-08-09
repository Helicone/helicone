-- Create roles idempotently so re-running migrations doesn't fail if roles exist
DO $$
BEGIN
    CREATE ROLE anon NOINHERIT;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'role anon already exists, skipping';
END $$ LANGUAGE plpgsql;

DO $$
BEGIN
    CREATE ROLE authenticated NOINHERIT;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'role authenticated already exists, skipping';
END $$ LANGUAGE plpgsql;

DO $$
BEGIN
    CREATE ROLE service_role NOINHERIT;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'role service_role already exists, skipping';
END $$ LANGUAGE plpgsql;
-- Grant usage on the public schema to these roles so they can potentially be granted table permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
-- The 'postgres' role (our current user) likely needs to be able to grant permissions to these roles
DO $$
BEGIN
    GRANT anon TO postgres;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'grant anon to postgres already exists, skipping';
END $$ LANGUAGE plpgsql;

DO $$
BEGIN
    GRANT authenticated TO postgres;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'grant authenticated to postgres already exists, skipping';
END $$ LANGUAGE plpgsql;

DO $$
BEGIN
    GRANT service_role TO postgres;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'grant service_role to postgres already exists, skipping';
END $$ LANGUAGE plpgsql;