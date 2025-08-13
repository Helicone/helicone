alter table "public"."evaluator" add column "code_template" jsonb;

alter table "public"."helicone_api_keys" add column "temp_key" boolean not null default false;


