-- Create a stub for the auth.uid() function required by RLS policies
-- This version throws an error if actually called, as it shouldn't be relied upon outside Supabase.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE plpgsql AS $$ BEGIN -- This function is a stub for compatibility with Supabase migration scripts.
    -- It should not be called directly in a non-Supabase environment.
    RAISE EXCEPTION 'auth.uid() stub function called. This indicates reliance on Supabase RLS helpers.';
-- Return dummy value to satisfy function signature if RAISE didn't halt execution (it should)
RETURN '00000000-0000-0000-0000-000000000000'::uuid;
END;
$$;
-- Grant execute permissions to the roles that might check for its existence
GRANT EXECUTE ON FUNCTION auth.uid() TO postgres;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO service_role;


