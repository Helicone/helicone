create table if not exists "public"."in_app_threads" (
    "id" uuid not null default gen_random_uuid(),
    "chat" jsonb not null,
    "user_id" uuid not null,
    "org_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "escalated" boolean not null default false,
    "metadata" jsonb not null,
    "updated_at" timestamp with time zone not null default now(),
    "soft_delete" boolean not null default false,
    constraint "in_app_threads_pkey" primary key ("id")
);

alter table "public"."in_app_threads" enable row level security;

revoke all on table "public"."in_app_threads" from public;
revoke all on table "public"."in_app_threads" from service_role;
revoke all on table "public"."in_app_threads" from anon;


create index in_app_threads_soft_delete_idx on "public"."in_app_threads" using btree (soft_delete);

-- btree on user_id and org_id
create index in_app_threads_user_id_org_id_idx on "public"."in_app_threads" using btree (user_id, org_id);

create trigger in_app_threads_updated_at_trigger
before update on "public"."in_app_threads"
for each row
execute function handle_updated_at();

