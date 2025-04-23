ALTER TABLE "public"."webhooks"
ADD COLUMN "version" text NOT NULL DEFAULT '2024-01-01',
ADD COLUMN "config" JSONB,
ADD COLUMN "hmac_key" text;

revoke all on table "public"."webhooks" from anon;
revoke all on table "public"."webhooks" from authenticated;
