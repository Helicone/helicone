-- Add credit line and negative balance support for PTB
-- This enables select organizations to exceed their prepaid balance

ALTER TABLE "public"."organization"
  ADD COLUMN "allow_negative_balance" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "credit_line_limit_cents" INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN "public"."organization"."allow_negative_balance" IS 'When true, allows PTB requests even when credit balance is negative (up to credit_line_limit_cents)';
COMMENT ON COLUMN "public"."organization"."credit_line_limit_cents" IS 'Maximum negative balance allowed in cents (e.g., 1000000 = $10,000 credit line). NULL means unlimited.';
