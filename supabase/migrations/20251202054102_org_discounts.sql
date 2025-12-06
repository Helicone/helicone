-- Add discounts JSONB column for per-org discount rules
-- Schema: [{ "provider": "helicone", "model": "gpt-%", "percent": 10 }]
ALTER TABLE organization ADD COLUMN discounts JSONB DEFAULT '[]';
