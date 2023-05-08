alter table "public"."organization" add column "color" text not null default 'gray'::text;

alter table "public"."organization" add column "icon" text not null default 'building'::text;


