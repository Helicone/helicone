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

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.organization;


CREATE POLICY "Enable read access for authenticated users of that org" ON public.organization AS PERMISSIVE FOR
SELECT TO PUBLIC USING (
        EXISTS (
            SELECT 1
            FROM public.organization_member om
            WHERE om.organization = organization.id
                AND om.member = auth.uid()
        )
        OR (
            organization.reseller_id IS NOT NULL
            AND EXISTS (
                SELECT 1
                FROM public.organization_member om
                WHERE om.organization = organization.reseller_id
                    AND om.member = auth.uid()
            )
        )
    );

create policy "Enable read access for all users" on "public"."organization_member" as permissive for select to public using ((member = auth.uid()));