alter table "public"."organization" add column "stripe_customer_id" text;

alter table "public"."organization" add column "stripe_subscription_id" text;

alter table "public"."organization" add column "subscription_status" text;

alter table "public"."organization" add column "tier" text default 'free'::text;


