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
    WHERE "owner" = NEW.owner AND "is_personal" = TRUE;

    IF personal_org_count > 0 THEN
      RAISE EXCEPTION 'A user can have only one personal organization';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_personal()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  user_id UUID := auth.uid();
  personal_org_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM "public"."organization"
    WHERE "owner" = user_id AND "is_personal" = TRUE
  ) INTO personal_org_exists;

  IF NOT personal_org_exists THEN
    INSERT INTO "public"."organization" ("name", "owner", "is_personal")
    VALUES ('Personal', user_id, TRUE);
  END IF;
END;
$function$
;

CREATE TRIGGER check_personal_organization_constraint_trigger BEFORE INSERT OR UPDATE ON public.organization FOR EACH ROW EXECUTE FUNCTION check_personal_organization_constraint();


