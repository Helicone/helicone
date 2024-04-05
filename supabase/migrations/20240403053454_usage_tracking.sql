CREATE TABLE organization_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization(id),
    usage_date DATE NOT NULL,
    quantity INT NOT NULL,
    type TEXT NOT NULL,
    error_message TEXT,
    stripe_record JSONB,
    recorded BOOLEAN DEFAULT FALSE,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);
CREATE INDEX idx_organization_id_period_start ON organization_usage(organization_id, usage_date);
ALTER TABLE organization_usage
ADD CONSTRAINT constraint_organization_usage UNIQUE (organization_id, usage_date);
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;