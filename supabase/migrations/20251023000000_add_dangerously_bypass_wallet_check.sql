-- Add dangerously_bypass_wallet_check column to organization table
-- This column, when enabled, completely bypasses ALL wallet checks including:
-- 1. Balance/escrow checks
-- 2. Dispute blocks
-- WARNING: This is a dangerous operation and should only be used for trusted organizations

alter table "public"."organization"
  add column "dangerously_bypass_wallet_check" boolean not null default false;

-- Add comment explaining the danger
comment on column "public"."organization"."dangerously_bypass_wallet_check" is
  'When true, completely bypasses all wallet checks (balance + disputes). Use with extreme caution.';
