set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_personal_soft_deleted_constraint()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_personal = TRUE AND NEW.soft_delete = TRUE THEN
    RAISE EXCEPTION 'is_personal and soft_delete cannot be both true for an organization';
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
    VALUES ('Personal Organization', user_id, TRUE);
  END IF;
END;
$function$
;

CREATE TRIGGER check_personal_soft_deleted_constraint_trigger BEFORE INSERT OR UPDATE ON public.organization FOR EACH ROW EXECUTE FUNCTION check_personal_soft_deleted_constraint();


