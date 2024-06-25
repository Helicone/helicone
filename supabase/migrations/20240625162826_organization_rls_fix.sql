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
create policy "Enable read access for all users" on "public"."organization_member" as permissive for
select to public using ((member = auth.uid()));
create policy "Enable only owner can update" on "public"."organization" as permissive for
update to public using (
        (
            (owner = auth.uid())
            OR (
                auth.uid() IN (
                    SELECT om.member
                    FROM organization_member om
                    WHERE (om.organization = organization.id)
                )
            )
        )
    ) with check (
        (
            (owner = auth.uid())
            OR (
                auth.uid() IN (
                    SELECT om.member
                    FROM organization_member om
                    WHERE (om.organization = organization.id)
                )
            )
        )
    );
CREATE OR REPLACE FUNCTION public.check_personal_soft_deleted_constraint() RETURNS trigger LANGUAGE plpgsql AS $function$ BEGIN IF NEW.is_personal = TRUE
    AND NEW.soft_delete = TRUE THEN RAISE EXCEPTION 'is_personal and soft_delete cannot be both true for an organization';
END IF;
RETURN NEW;
END;
$function$;
CREATE TRIGGER check_personal_soft_deleted_constraint_trigger BEFORE
INSERT
    OR
UPDATE ON public.organization FOR EACH ROW EXECUTE FUNCTION check_personal_soft_deleted_constraint();
CREATE OR REPLACE FUNCTION organization_insert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
INSERT INTO public.organization_member (created_at, member, organization, org_role)
VALUES (NEW.created_at, NEW.owner, NEW.id, 'owner');
RETURN NEW;
END $$;
-- Trigger to add owner as member
CREATE TRIGGER organization_insert_trigger
AFTER
INSERT ON public.organization FOR EACH ROW EXECUTE FUNCTION organization_insert();