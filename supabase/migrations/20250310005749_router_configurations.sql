-- Add router_configurations table for storing router configuration parameters
CREATE TABLE public.router_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    soft_delete BOOLEAN DEFAULT FALSE,
    -- Configuration JSON containing router parameters
    config JSONB NOT NULL DEFAULT '{}'::JSONB,
    CONSTRAINT router_configurations_org_id_fkey FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE
);
-- Add index on org_id for faster queries
CREATE INDEX router_configurations_org_id_idx ON public.router_configurations(org_id);
-- Add column for tracking if config is active
ALTER TABLE public.router_configurations
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
-- Create junction table between router_configurations and provider_keys
CREATE TABLE public.router_provider_mappings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    router_id UUID NOT NULL,
    provider_key_id UUID NOT NULL,
    role TEXT NOT NULL,
    -- 'primary', 'fallback', 'conditional'
    weight FLOAT DEFAULT 1.0,
    -- For weighted routing strategies
    conditions JSONB DEFAULT NULL,
    -- Conditions for when to use this provider
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT router_provider_mappings_router_id_fkey FOREIGN KEY (router_id) REFERENCES public.router_configurations(id) ON DELETE CASCADE,
    CONSTRAINT router_provider_mappings_provider_key_id_fkey FOREIGN KEY (provider_key_id) REFERENCES public.provider_keys(id) ON DELETE CASCADE,
    CONSTRAINT unique_router_provider_mapping UNIQUE (router_id, provider_key_id)
);
-- Add index for faster lookups
CREATE INDEX router_provider_mappings_router_id_idx ON public.router_provider_mappings(router_id);
CREATE INDEX router_provider_mappings_provider_key_id_idx ON public.router_provider_mappings(provider_key_id);
-- Create table for tracking router usage and metrics
CREATE TABLE public.router_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    router_id UUID NOT NULL,
    provider_key_id UUID NOT NULL,
    request_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    route_decision_time_ms INTEGER,
    -- How long it took to make the routing decision
    route_success BOOLEAN DEFAULT TRUE,
    -- Whether the routing was successful
    fallback_triggered BOOLEAN DEFAULT FALSE,
    -- Whether a fallback provider was used
    routing_reason TEXT,
    -- Why this provider was chosen
    request_context JSONB,
    -- Context about the request that influenced the decision
    CONSTRAINT router_usage_router_id_fkey FOREIGN KEY (router_id) REFERENCES public.router_configurations(id) ON DELETE CASCADE,
    CONSTRAINT router_usage_provider_key_id_fkey FOREIGN KEY (provider_key_id) REFERENCES public.provider_keys(id) ON DELETE CASCADE,
    CONSTRAINT router_usage_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.request(id) ON DELETE
    SET NULL
);
-- Add index for faster lookups
CREATE INDEX router_usage_router_id_idx ON public.router_usage(router_id);
CREATE INDEX router_usage_provider_key_id_idx ON public.router_usage(provider_key_id);
CREATE INDEX router_usage_request_id_idx ON public.router_usage(request_id);
CREATE INDEX router_usage_created_at_idx ON public.router_usage(created_at);
-- Add router_id column to helicone_proxy_keys table
ALTER TABLE public.helicone_proxy_keys
ADD COLUMN router_id UUID DEFAULT NULL;
ALTER TABLE public.helicone_proxy_keys
ADD CONSTRAINT helicone_proxy_keys_router_id_fkey FOREIGN KEY (router_id) REFERENCES public.router_configurations(id) ON DELETE
SET NULL;
-- Add index for faster lookups
CREATE INDEX helicone_proxy_keys_router_id_idx ON public.helicone_proxy_keys(router_id);
-- Add comment explaining config structure
COMMENT ON COLUMN public.router_configurations.config IS 'Stores router configuration parameters such as limits, destinations, and routing rules. Example:
{
  "limits": {
    "rate": {
      "requests_per_minute": 60,
      "tokens_per_day": 100000
    },
    "cost": {
      "max_cost_per_request": 0.05,
      "max_cost_per_day": 10.00,
      "currency": "USD"
    }
  },
  "routing_strategy": "weighted-random" // or "round-robin", "fallback-only", "cost-optimized"
}';