-- Create index on helicone_api_keys for soft_delete and organization_id
-- This optimizes queries that filter by organization and soft_delete status
CREATE INDEX IF NOT EXISTS idx_helicone_api_keys_org_soft_delete
ON public.helicone_api_keys (organization_id, soft_delete);

-- Soft delete auto-generated experiment keys older than 7 days
UPDATE public.helicone_api_keys
SET soft_delete = true
WHERE api_key_name = 'auto-generated-experiment-key'
  AND created_at < now() - interval '7 days'
  AND soft_delete = false;

-- Soft delete temp keys older than 7 days
UPDATE public.helicone_api_keys
SET soft_delete = true
WHERE temp_key = true
  AND created_at < now() - interval '7 days'
  AND soft_delete = false;
