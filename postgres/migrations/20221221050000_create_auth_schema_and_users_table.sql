-- Create the 'auth' schema and the 'users' table based on Supabase definition
-- 1. Create the schema
CREATE SCHEMA IF NOT EXISTS auth;
-- 2. Grant usage to relevant roles (including the ones we created earlier)
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
-- 3. Create the auth.users table (excluding triggers)
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid not null,
    email character varying(255) null,
    last_sign_in_at timestamp without time zone null,
    created_at timestamp without time zone default now(),
    constraint users_pkey primary key (id)
) TABLESPACE pg_default;
-- Grant permissions on the table to the roles (mirroring what might be expected)
-- Grants are idempotent in practice; if role/table exists, these apply or no-op
GRANT ALL ON TABLE auth.users TO postgres;
GRANT ALL ON TABLE auth.users TO anon;
GRANT ALL ON TABLE auth.users TO authenticated;
GRANT ALL ON TABLE auth.users TO service_role;
-- 4. Create indexes
CREATE INDEX IF NOT EXISTS users_id_idx on auth.users using btree (id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS users_id_email_idx on auth.users using btree (id, lower((email)::text)) TABLESPACE pg_default;
