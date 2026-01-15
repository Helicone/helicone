-- Add subtotal_cents to track pre-discount amount for wallet crediting
-- Nullable for backwards compatibility with existing invoices
ALTER TABLE "public"."ptb_invoices"
ADD COLUMN "subtotal_cents" BIGINT;
