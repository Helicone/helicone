create table "public"."admins" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid,
    "user_email" text
);


alter table "public"."admins" enable row level security;

create table "public"."alert_banners" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "title" text,
    "message" text,
    "active" boolean not null default false,
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."alert_banners" enable row level security;

CREATE UNIQUE INDEX admins_id_key ON public.admins USING btree (id);

CREATE UNIQUE INDEX admins_pkey ON public.admins USING btree (id);

CREATE UNIQUE INDEX alert_banners_pkey ON public.alert_banners USING btree (id);

alter table "public"."admins" add constraint "admins_pkey" PRIMARY KEY using index "admins_pkey";

alter table "public"."alert_banners" add constraint "alert_banners_pkey" PRIMARY KEY using index "alert_banners_pkey";

alter table "public"."admins" add constraint "admins_id_key" UNIQUE using index "admins_id_key";

alter table "public"."admins" add constraint "admins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."admins" validate constraint "admins_user_id_fkey";

create policy "Enable read access for all users"
on "public"."alert_banners"
as permissive
for select
to public
using (true);



