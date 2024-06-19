-- Drop all existing policies for the 'organization' table
DROP POLICY IF EXISTS delete_policy ON public.organization;
DROP POLICY IF EXISTS update_policy ON public.organization;
DROP POLICY IF EXISTS select_policy ON public.organization;

-- Disable Row-Level Security on the 'organization' table
ALTER TABLE public.organization DISABLE ROW LEVEL SECURITY;

-- Create a new policy to allow delete for the owner
CREATE POLICY delete_policy ON public.organization
FOR DELETE
USING (auth.uid() = owner_id);

-- Create a new policy to allow updates only for the owner
CREATE POLICY update_policy ON public.organization
FOR UPDATE
USING (auth.uid() = owner_id);

-- Create a new policy to allow read access for all users
CREATE POLICY select_policy ON public.organization
FOR SELECT
USING (true);

-- Re-enable Row-Level Security on the 'organization' table
ALTER TABLE public.organization ENABLE ROW LEVEL SECURITY;