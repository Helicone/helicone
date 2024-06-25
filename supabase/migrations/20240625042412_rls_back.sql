create policy "Enable read access for all users"
on "public"."organization_member"
as permissive
for select
to public
using ((member = auth.uid()));

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

-- Function to add owner as member
CREATE OR REPLACE FUNCTION organization_insert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
INSERT INTO public.organization_member (created_at, member, organization, org_role)
VALUES (NEW.created_at, NEW.owner, NEW.id, 'owner');
RETURN NEW;
END $$;
-- Trigger to add owner as member
CREATE TRIGGER organization_insert_trigger
AFTER
INSERT ON public.organization FOR EACH ROW EXECUTE FUNCTION organization_insert();