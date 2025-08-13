alter table "public"."helicone_proxy_key_limits" drop constraint "helicone_proxy_key_limits_provider_key_fkey";

alter table "public"."helicone_proxy_key_limits" drop column "provider_key";

alter table "public"."helicone_proxy_key_limits" add column "helicone_proxy_key" uuid not null;

alter table "public"."helicone_proxy_key_limits" add constraint "helicone_proxy_key_limits_helicone_proxy_key_fkey" FOREIGN KEY (helicone_proxy_key) REFERENCES helicone_proxy_keys(id) not valid;

alter table "public"."helicone_proxy_key_limits" validate constraint "helicone_proxy_key_limits_helicone_proxy_key_fkey";


