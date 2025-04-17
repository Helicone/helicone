alter table "public"."organization_member" drop constraint "organization_member_member_fkey";
alter table "public"."organization_member" drop constraint "organization_member_pkey";
drop index if exists "public"."organization_member_pkey";
create table "public"."account" (
    "id" text not null,
    "accountId" text not null,
    "providerId" text not null,
    "userId" text not null,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp without time zone,
    "refreshTokenExpiresAt" timestamp without time zone,
    "scope" text,
    "password" text,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null
);
create table "public"."session" (
    "id" text not null,
    "expiresAt" timestamp without time zone not null,
    "token" text not null,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "ipAddress" text,
    "userAgent" text,
    "userId" text not null
);
create table "public"."system_config" (
    "key" text not null,
    "value" text not null,
    "description" text,
    "created_at" timestamp with time zone default now()
);
alter table "public"."system_config" enable row level security;
create table "public"."user" (
    "id" text not null,
    "name" text not null,
    "email" text not null,
    "emailVerified" boolean not null,
    "image" text,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "auth_user_id" uuid not null default gen_random_uuid()
);
create table "public"."verification" (
    "id" text not null,
    "identifier" text not null,
    "value" text not null,
    "expiresAt" timestamp without time zone not null,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone
);
alter table "public"."organization"
alter column "owner" drop not null;
alter table "public"."organization_member"
add column "id" uuid not null default gen_random_uuid();
alter table "public"."organization_member"
add column "user" text;
alter table "public"."organization_member"
alter column "member" drop not null;
alter table "public"."response"
add column "completion_audio_tokens" integer;
alter table "public"."response"
add column "prompt_audio_tokens" integer;
create policy "Allow postgres access to system_config" on "public"."system_config" as permissive for all to postgres using (true);
CREATE UNIQUE INDEX account_pkey ON public.account USING btree (id);
CREATE UNIQUE INDEX session_pkey ON public.session USING btree (id);
CREATE UNIQUE INDEX session_token_key ON public.session USING btree (token);
CREATE UNIQUE INDEX system_config_pkey ON public.system_config USING btree (key);
CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);
CREATE UNIQUE INDEX user_pkey ON public."user" USING btree (id);
CREATE UNIQUE INDEX user_auth_user_id_key ON public."user" USING btree (auth_user_id);
CREATE UNIQUE INDEX verification_pkey ON public.verification USING btree (id);
CREATE UNIQUE INDEX organization_member_pkey ON public.organization_member USING btree (id);
alter table "public"."account"
add constraint "account_pkey" PRIMARY KEY using index "account_pkey";
alter table "public"."session"
add constraint "session_pkey" PRIMARY KEY using index "session_pkey";
alter table "public"."system_config"
add constraint "system_config_pkey" PRIMARY KEY using index "system_config_pkey";
alter table "public"."user"
add constraint "user_pkey" PRIMARY KEY using index "user_pkey";
alter table "public"."verification"
add constraint "verification_pkey" PRIMARY KEY using index "verification_pkey";
alter table "public"."organization_member"
add constraint "organization_member_pkey" PRIMARY KEY using index "organization_member_pkey";
alter table "public"."account"
add constraint "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) not valid;
alter table "public"."account" validate constraint "account_userId_fkey";
alter table "public"."organization_member"
add constraint "organization_member_user_fkey" FOREIGN KEY ("user") REFERENCES "user"(id) not valid;
alter table "public"."organization_member" validate constraint "organization_member_user_fkey";
alter table "public"."session"
add constraint "session_token_key" UNIQUE using index "session_token_key";
alter table "public"."session"
add constraint "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) not valid;
alter table "public"."session" validate constraint "session_userId_fkey";
alter table "public"."user"
add constraint "user_email_key" UNIQUE using index "user_email_key";
alter table "public"."user"
add constraint "user_auth_user_id_key" UNIQUE using index "user_auth_user_id_key";