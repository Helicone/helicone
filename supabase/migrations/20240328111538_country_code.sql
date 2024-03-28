alter table "public"."request" drop column request_ip;

alter table "public"."request" add column "country_code" text default null;
