alter table "public"."prompt_input_record" add column "auto_prompt_inputs" jsonb not null default '[]'::jsonb;


