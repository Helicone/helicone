-- Create an index on request_id if it doesn't exist
CREATE INDEX CONCURRENTLY IF NOT EXISTS cache_hits_created_at_desc_idx ON public.cache_hits USING btree (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS cache_hits_request_id_idx ON public.cache_hits USING btree (request_id);
ALTER TABLE IF EXISTS public.cache_hits
ADD COLUMN IF NOT EXISTS organization_id uuid;
-- Create an index on organization_id and created_at desc if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_cache_hits_org_id_created_at_desc ON public.cache_hits (organization_id, created_at DESC);