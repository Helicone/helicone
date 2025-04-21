-- Drop the specific policies for the 'organization' table
DROP POLICY IF EXISTS "Enable delete for owner" ON public.organization;
DROP POLICY IF EXISTS "Enable only owner can update" ON public.organization;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organization;

-- Drop all existing policies for the 'organization' table if there are any left
DROP POLICY IF EXISTS delete_policy ON public.organization;
DROP POLICY IF EXISTS update_policy ON public.organization;
DROP POLICY IF EXISTS select_policy ON public.organization;

-- Drop the policy Enable read access for all users on 'organization_member' table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organization_member;

-- Drop the trigger for check_personal_soft_deleted_constraint
DROP TRIGGER IF EXISTS check_personal_soft_deleted_constraint_trigger ON public.organization;

-- Drop the function check_personal_soft_deleted_constraint
DROP FUNCTION IF EXISTS public.check_personal_soft_deleted_constraint;

-- Drop the trigger for organization_insert
DROP TRIGGER IF EXISTS organization_insert_trigger ON public.organization;

-- Drop the function organization_insert
DROP FUNCTION IF EXISTS public.organization_insert;