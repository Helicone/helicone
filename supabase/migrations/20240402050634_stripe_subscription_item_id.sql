ALTER TABLE public.organization
ADD COLUMN stripe_subscription_item_id text;
ALTER TABLE public.organization
ADD COLUMN subscription_date timestamp with time zone;