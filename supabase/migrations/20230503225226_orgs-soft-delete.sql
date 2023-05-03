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

CREATE TRIGGER check_personal_soft_deleted_constraint_trigger BEFORE INSERT OR UPDATE ON public.organization FOR EACH ROW EXECUTE FUNCTION check_personal_soft_deleted_constraint();


