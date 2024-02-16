create table "public"."prompt" (
    "created_at" timestamp with time zone default now(),
    "prompt" text not null,
    "name" text not null,
    "id" uuid not null,
    "auth_hash" text not null
);


alter table "public"."prompt" enable row level security;

alter table "public"."request" add column "formatted_prompt_id" uuid;

alter table "public"."request" add column "prompt_values" jsonb;

CREATE UNIQUE INDEX prompt_pkey ON public.prompt USING btree (id);

alter table "public"."prompt" add constraint "prompt_pkey" PRIMARY KEY using index "prompt_pkey";

alter table "public"."request" add constraint "request_formatted_prompt_id_fkey" FOREIGN KEY (formatted_prompt_id) REFERENCES prompt(id) not valid;

alter table "public"."request" validate constraint "request_formatted_prompt_id_fkey";

create or replace view "public"."response_and_request_rbac" as  SELECT response.body AS response_body,
    response.id AS response_id,
    response.created_at AS response_created_at,
    request.id AS request_id,
    request.body AS request_body,
    request.path AS request_path,
    request.created_at AS request_created_at,
    request.user_id AS request_user_id,
    user_api_keys.api_key_preview,
    user_api_keys.user_id,
    request.properties AS request_properties,
    request.formatted_prompt_id,
    request.prompt_values,
    prompt.name AS prompt_name,
    prompt.prompt AS prompt_regex
   FROM (((response
     LEFT JOIN request ON ((request.id = response.request)))
     LEFT JOIN user_api_keys ON ((user_api_keys.api_key_hash = request.auth_hash)))
     LEFT JOIN prompt ON ((request.formatted_prompt_id = prompt.id)))
  WHERE (auth.uid() = user_api_keys.user_id);



