-- Create table for organization auto top-off settings
CREATE TABLE IF NOT EXISTS "public"."organization_auto_topoff" (
  "organization_id" UUID PRIMARY KEY REFERENCES "public"."organization"("id") ON DELETE CASCADE,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "threshold_cents" BIGINT NOT NULL CHECK (threshold_cents >= 0),
  "topoff_amount_cents" BIGINT NOT NULL CHECK (topoff_amount_cents > 0),
  "stripe_payment_method_id" TEXT,
  "last_topoff_at" TIMESTAMP WITH TIME ZONE,
  "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index for enabled organizations (for efficient querying)
CREATE INDEX IF NOT EXISTS "organization_auto_topoff_enabled_idx"
  ON "public"."organization_auto_topoff"("enabled")
  WHERE "enabled" = true;

-- Note: RLS policies will be added in a future migration once auth structure is confirmed
-- For now, access is controlled via backend API endpoints

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_auto_topoff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organization_auto_topoff_updated_at
  BEFORE UPDATE ON "public"."organization_auto_topoff"
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_auto_topoff_updated_at();
