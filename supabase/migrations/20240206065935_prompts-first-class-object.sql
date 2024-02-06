create table "public"."prompts" (
    "id" text not null,
    "created_at" timestamp with time zone not null default now(),
    "description" text,
    "heliconeTemplate" jsonb,
    "status" text not null default 'PENDING'::text,
    "version" integer not null default 0,
    "organization_id" uuid not null
);



alter table "public"."prompts" enable row level security;

CREATE UNIQUE INDEX prompts_pkey ON public.prompts USING btree (organization_id, version, id);

alter table "public"."prompts" add constraint "prompts_pkey" PRIMARY KEY using index "prompts_pkey";

alter table "public"."prompts" add constraint "prompts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."prompts" validate constraint "prompts_organization_id_fkey";

grant delete on table "public"."prompts" to "anon";

grant insert on table "public"."prompts" to "anon";

grant references on table "public"."prompts" to "anon";

grant select on table "public"."prompts" to "anon";

grant trigger on table "public"."prompts" to "anon";

grant truncate on table "public"."prompts" to "anon";

grant update on table "public"."prompts" to "anon";

grant delete on table "public"."prompts" to "authenticated";

grant insert on table "public"."prompts" to "authenticated";

grant references on table "public"."prompts" to "authenticated";

grant select on table "public"."prompts" to "authenticated";

grant trigger on table "public"."prompts" to "authenticated";

grant truncate on table "public"."prompts" to "authenticated";

grant update on table "public"."prompts" to "authenticated";

grant delete on table "public"."prompts" to "service_role";

grant insert on table "public"."prompts" to "service_role";

grant references on table "public"."prompts" to "service_role";

grant select on table "public"."prompts" to "service_role";

grant trigger on table "public"."prompts" to "service_role";

grant truncate on table "public"."prompts" to "service_role";

grant update on table "public"."prompts" to "service_role";


