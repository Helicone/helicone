CREATE TABLE IF NOT EXISTS property_metadata (
    id SERIAL PRIMARY KEY,
    property_name TEXT NOT NULL,
    org_id TEXT NOT NULL,
    hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_name, org_id)
);

CREATE INDEX IF NOT EXISTS idx_property_metadata_org ON property_metadata(org_id); 