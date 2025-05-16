-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.set_enterprise_tier_for_main_org() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Only set enterprise tier for main organizations
    IF NEW.is_main_org = true THEN
        NEW.tier := 'enterprise';
    END IF;
    RETURN NEW;
END;
$$;

-- Create the trigger on organization table
CREATE TRIGGER set_enterprise_tier_before_org_creation
    BEFORE INSERT ON public.organization
    FOR EACH ROW
    EXECUTE FUNCTION public.set_enterprise_tier_for_main_org();