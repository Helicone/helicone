ALTER TABLE public.user_settings
ADD COLUMN referral_code TEXT;
CREATE TABLE referrals (
    id uuid not null default gen_random_uuid () primary key,
    referrer_user_id uuid REFERENCES auth.users (id) MATCH SIMPLE,
    referred_user_id uuid REFERENCES auth.users (id) MATCH SIMPLE,
    created_at timestamp with time zone null default now(),
    status TEXT
);