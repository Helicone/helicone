drop policy "only users can view and edit their helicone keys" on "public"."helicone_api_keys";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_personal_organization_constraint()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  personal_org_count INTEGER;
BEGIN
  IF NEW.is_personal THEN
    SELECT COUNT(*)
    INTO personal_org_count
    FROM "public"."organization"
    WHERE "owner" = NEW.owner AND "is_personal" = TRUE
    AND (TG_OP != 'UPDATE' OR id != NEW.id);

    IF personal_org_count > 0 THEN
      RAISE EXCEPTION 'A user can have only one personal organization';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

create policy "only users can view and edit their helicone keys"
on "public"."helicone_api_keys"
as permissive
for all
to public
using ((((auth.uid() = user_id)) OR (auth.uid() = ( SELECT organization.owner
   FROM organization
  WHERE (organization.id = helicone_api_keys.organization_id))) OR (auth.uid() IN ( SELECT om.member
   FROM organization_member om
  WHERE (om.organization = helicone_api_keys.organization_id)))))
with check ((((auth.uid() = user_id)) OR (auth.uid() = ( SELECT organization.owner
   FROM organization
  WHERE (organization.id = helicone_api_keys.organization_id))) OR (auth.uid() IN ( SELECT om.member
   FROM organization_member om
  WHERE (om.organization = helicone_api_keys.organization_id)))));



drop policy "Enable only owner can update" on "public"."organization";

create policy "Enable only owner can update"
on "public"."organization"
as permissive
for update
to public
using (((owner = auth.uid()) OR (auth.uid() IN ( SELECT om.member
   FROM organization_member om
  WHERE (om.organization = organization.id)))))
with check (((owner = auth.uid()) OR (auth.uid() IN ( SELECT om.member
   FROM organization_member om
  WHERE (om.organization = organization.id)))));



