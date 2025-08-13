CREATE TYPE mapper_status AS ENUM (
    'PENDING_CREATION',
    'PENDING_UPDATE',
    'IN_PROGRESS',
    'PENDING_APPROVAL',
    'ACTIVE',
    'INACTIVE',
    'DECLINED',
    'FAILED'
);
CREATE TABLE rosetta_mappers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL,
    version INTEGER NOT NULL,
    status mapper_status NOT NULL,
    output_schema_hash TEXT NOT NULL,
    output_schema JSONB NOT NULL,
    input_json JSONB NOT NULL,
    code TEXT NOT NULL,
    ignored_fields TEXT [] DEFAULT '{}',
    mapped_fields TEXT [] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (key, version)
);
CREATE INDEX idx_rosetta_mapper_lookup ON rosetta_mappers(key);
-- Enable row level security
ALTER TABLE rosetta_mappers ENABLE ROW LEVEL SECURITY;