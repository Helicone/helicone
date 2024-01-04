drop policy "Enable read access for all users" on "public"."organization";
CREATE POLICY "Enable read access for all users" ON public.organization AS PERMISSIVE FOR
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