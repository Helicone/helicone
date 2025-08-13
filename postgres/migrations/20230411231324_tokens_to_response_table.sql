alter table "public"."response" add column "completion_tokens" integer;

alter table "public"."response" add column "prompt_tokens" integer;

UPDATE response
SET prompt_tokens = (body->'usage'->>'prompt_tokens')::integer,
    completion_tokens = (body->'usage'->>'completion_tokens')::integer;

