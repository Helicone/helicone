CREATE TABLE organization_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization(id),
    usage_date DATE NOT NULL,
    usage_type TEXT NOT NULL,
    usage_count INT NOT NULL,
    recorded BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    stripe_record JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);
CREATE INDEX idx_usage_date ON organization_usage(usage_date);
CREATE INDEX idx_organization_id ON organization_usage(organization_id);
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;