alter table "public"."helicone_proxy_key_limits" drop constraint "chk_cost_currency";

alter table "public"."helicone_proxy_key_limits" drop constraint "chk_ensure_one_cost_or_count";

alter table "public"."helicone_proxy_key_limits" drop constraint "chk_not_all_null";

alter table "public"."helicone_proxy_key_limits" drop constraint "chk_timewindow_must_exist";

alter table "public"."helicone_proxy_key_limits" drop constraint "helicone_proxy_key_limits_provider_key_fkey";

alter table "public"."helicone_proxy_key_limits" drop column "provider_key";

alter table "public"."helicone_proxy_key_limits" add column "helicone_proxy_key" uuid not null;

alter table "public"."helicone_proxy_key_limits" add constraint "helicone_proxy_key_limits_helicone_proxy_key_fkey" FOREIGN KEY (helicone_proxy_key) REFERENCES helicone_proxy_keys(id) not valid;

alter table "public"."helicone_proxy_key_limits" validate constraint "helicone_proxy_key_limits_helicone_proxy_key_fkey";


