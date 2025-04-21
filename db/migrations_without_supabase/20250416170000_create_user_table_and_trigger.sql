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
alter table "public"."account" enable row level security;
REVOKE ALL PRIVILEGES ON TABLE "public"."account"
FROM anon;
REVOKE ALL PRIVILEGES ON TABLE "public"."account"
FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE "public"."account"
FROM service_role;
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
alter table "public"."session" enable row level security;
REVOKE ALL PRIVILEGES ON TABLE "public"."session"
FROM anon;
REVOKE ALL PRIVILEGES ON TABLE "public"."session"
FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE "public"."session"
FROM service_role;
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
alter table "public"."user" enable row level security;
REVOKE ALL PRIVILEGES ON TABLE "public"."user"
FROM anon;
REVOKE ALL PRIVILEGES ON TABLE "public"."user"
FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE "public"."user"
FROM service_role;
create table "public"."verification" (
    "id" text not null,
    "identifier" text not null,
    "value" text not null,
    "expiresAt" timestamp without time zone not null,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone
);
alter table "public"."verification" enable row level security;
REVOKE ALL PRIVILEGES ON TABLE "public"."verification"
FROM anon;
REVOKE ALL PRIVILEGES ON TABLE "public"."verification"
FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE "public"."verification"
FROM service_role;
alter table "public"."organization"
alter column "owner" drop not null;
alter table "public"."organization_member"
add column "id" uuid not null default gen_random_uuid();
alter table "public"."organization_member"
add column "user" text;
alter table "public"."organization_member"
alter column "member" drop not null;
CREATE UNIQUE INDEX account_pkey ON public.account USING btree (id);
CREATE UNIQUE INDEX session_pkey ON public.session USING btree (id);
CREATE UNIQUE INDEX session_token_key ON public.session USING btree (token);
CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);
CREATE UNIQUE INDEX user_pkey ON public."user" USING btree (id);
CREATE UNIQUE INDEX user_auth_user_id_key ON public."user" USING btree (auth_user_id);
CREATE UNIQUE INDEX verification_pkey ON public.verification USING btree (id);
CREATE UNIQUE INDEX organization_member_pkey ON public.organization_member USING btree (id);
alter table "public"."account"
add constraint "account_pkey" PRIMARY KEY using index "account_pkey";
alter table "public"."session"
add constraint "session_pkey" PRIMARY KEY using index "session_pkey";
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