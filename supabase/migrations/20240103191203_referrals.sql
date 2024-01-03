ALTER TABLE public.user_settings
ADD COLUMN referral_code uuid not null default gen_random_uuid ();
CREATE TABLE referrals (
    id uuid not null default gen_random_uuid() primary key,
    referrer_user_id uuid REFERENCES auth.users (id) MATCH SIMPLE,
    referred_user_id uuid REFERENCES auth.users (id) MATCH SIMPLE,
    created_at timestamp with time zone null default now(),
    status TEXT
);
-- add rls to referrals
alter table referrals enable row level security;
-- inserts a row into public.user_settings
create function public.handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$ begin
INSERT INTO public.user_settings ("user")
values (new.id);
return new;
end;
$$;
-- trigger the function every time a user is created
create trigger on_auth_user_created
after
insert on auth.users for each row execute procedure public.handle_new_user();
-- backfill
DO $$
DECLARE user_record auth.users %ROWTYPE;
BEGIN FOR user_record IN
SELECT *
FROM auth.users LOOP
INSERT INTO public.user_settings ("user")
VALUES (user_record.id) ON CONFLICT ("user") DO NOTHING;
END LOOP;
END $$;