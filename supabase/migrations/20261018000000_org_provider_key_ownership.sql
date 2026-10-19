-- INC-710: organization.org_provider_key makes Helicone attach the referenced
-- stored provider key to requests made with that organization's
-- customer-portal API keys. Until now the only database constraint was a
-- foreign key to provider_keys(id), so any organization could point at any
-- other organization's provider key.
--
-- Invariant enforced here: the referenced provider key must belong to the
-- organization itself, or to the reseller organization recorded in
-- reseller_id (which must be an organization of type 'reseller').
--
-- Validation runs on INSERT, and on UPDATE only when org_provider_key or
-- reseller_id changes. Existing rows are NOT validated or modified by this
-- migration, so pre-existing violations do not block unrelated updates
-- (soft deletes, billing changes, etc.). Clearing a bad value by setting
-- org_provider_key to NULL is always allowed. Cleanup of existing rows is
-- handled separately.
--
-- Audit query for existing violations:
--
--   SELECT o.id, o.org_provider_key, pk.org_id AS provider_key_org, o.reseller_id
--   FROM organization o
--   JOIN provider_keys pk ON pk.id = o.org_provider_key
--   WHERE pk.org_id <> o.id
--     AND (o.reseller_id IS NULL OR pk.org_id <> o.reseller_id);

-- reseller_id was added outside of migrations in some environments (the
-- original migration that introduced it is commented out). Make sure it
-- exists everywhere; this is a no-op where it already does.
ALTER TABLE public.organization
  ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES public.organization (id);

CREATE OR REPLACE FUNCTION public.enforce_org_provider_key_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  key_org_id uuid;
BEGIN
  IF NEW.org_provider_key IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.org_provider_key IS NOT DISTINCT FROM OLD.org_provider_key
     AND NEW.reseller_id IS NOT DISTINCT FROM OLD.reseller_id THEN
    RETURN NEW;
  END IF;

  SELECT pk.org_id
    INTO key_org_id
    FROM public.provider_keys pk
   WHERE pk.id = NEW.org_provider_key;

  IF key_org_id IS NOT NULL AND key_org_id = NEW.id THEN
    RETURN NEW;
  END IF;

  -- Compare as text so this keeps working if reseller_id predates this
  -- migration with a non-uuid type.
  IF key_org_id IS NOT NULL
     AND NEW.reseller_id IS NOT NULL
     AND key_org_id::text = NEW.reseller_id::text
     AND EXISTS (
       SELECT 1
         FROM public.organization r
        WHERE r.id = key_org_id
          AND r.organization_type = 'reseller'
     ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'org_provider_key must reference a provider key owned by this organization or its reseller'
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_org_provider_key_ownership() FROM PUBLIC;

DROP TRIGGER IF EXISTS organization_org_provider_key_ownership ON public.organization;

CREATE TRIGGER organization_org_provider_key_ownership
  BEFORE INSERT OR UPDATE OF org_provider_key, reseller_id
  ON public.organization
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_org_provider_key_ownership();
