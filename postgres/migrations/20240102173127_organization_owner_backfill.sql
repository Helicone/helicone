DO $$
DECLARE org_record public.organization %ROWTYPE;
BEGIN FOR org_record IN
SELECT *
FROM public.organization LOOP
INSERT INTO public.organization_member (created_at, member, organization, org_role)
VALUES (
        org_record.created_at,
        org_record.owner,
        org_record.id,
        'owner'
    ) ON CONFLICT (member, organization) DO NOTHING;
END LOOP;
END $$;
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