alter table "public"."organization" add column "allow_negative_balance" boolean not null default false;

alter table "public"."organization" add column "credit_limit" bigint not null default '0'::bigint check (credit_limit >= 0);


