create table "public"."prompts_2025_inputs" (
    "id" uuid not null default gen_random_uuid(),
    "request_id" uuid not null,
    "version_id" uuid default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "inputs" jsonb not null
);

alter table "public"."prompts_2025_inputs" enable row level security;

CREATE UNIQUE INDEX prompts_2025_inputs_pkey ON public.prompts_2025_inputs USING btree (id);

alter table "public"."prompts_2025_inputs" add constraint "prompts_2025_inputs_pkey" PRIMARY KEY using index "prompts_2025_inputs_pkey";

alter table "public"."prompts_2025_inputs" add constraint "prompts_2025_inputs_version_id_fkey" FOREIGN KEY (version_id) REFERENCES prompts_2025_versions(id) ON DELETE CASCADE not valid;

alter table "public"."prompts_2025_inputs" validate constraint "prompts_2025_inputs_version_id_fkey";

alter table "public"."prompts_2025_inputs" add constraint "prompts_2025_inputs_request_id_fkey" FOREIGN KEY (request_id) REFERENCES request(id) ON DELETE CASCADE not valid;

alter table "public"."prompts_2025_inputs" validate constraint "prompts_2025_inputs_request_id_fkey";