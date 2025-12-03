-- Track invoices created for PTB (passthrough billing) customers
-- Used to calculate uninvoiced balance = total ClickHouse spend - invoiced amounts

CREATE TABLE IF NOT EXISTS "public"."ptb_invoices" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL REFERENCES "public"."organization"("id") ON DELETE CASCADE,
  "stripe_invoice_id" TEXT,
  "hosted_invoice_url" TEXT,
  "start_date" TIMESTAMPTZ NOT NULL,
  "end_date" TIMESTAMPTZ NOT NULL,
  "amount_cents" BIGINT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ptb_invoices_org ON "public"."ptb_invoices"(organization_id);
CREATE INDEX IF NOT EXISTS idx_ptb_invoices_created_at ON "public"."ptb_invoices"(created_at DESC);

-- Enable Row Level Security
ALTER TABLE "public"."ptb_invoices" ENABLE ROW LEVEL SECURITY;

-- Revoke all privileges from public roles (admin-only table)
REVOKE ALL PRIVILEGES ON TABLE "public"."ptb_invoices" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE "public"."ptb_invoices" FROM authenticated;
