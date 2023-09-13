create table "public"."helicone_proxy_key_limits" (
    "id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "provider_key" uuid not null,
    "currency" text,
    "cost" double precision,
    "count" bigint,
    "timewindow_seconds" bigint
);


alter table "public"."helicone_proxy_key_limits" enable row level security;

CREATE UNIQUE INDEX helicone_proxy_key_limits_pkey ON public.helicone_proxy_key_limits USING btree (id);

alter table "public"."helicone_proxy_key_limits" add constraint "helicone_proxy_key_limits_pkey" PRIMARY KEY using index "helicone_proxy_key_limits_pkey";

alter table "public"."helicone_proxy_key_limits" add constraint "helicone_proxy_key_limits_provide_key_fkey" FOREIGN KEY (provide_key) REFERENCES provider_keys(id) not valid;

alter table "public"."helicone_proxy_key_limits" validate constraint "helicone_proxy_key_limits_provide_key_fkey";


ALTER TABLE "public"."helicone_proxy_key_limits" 
ADD CONSTRAINT chk_cost_currency 
CHECK (
    (cost IS NOT NULL AND currency IS NOT NULL) OR 
    (cost IS NULL AND currency IS NULL)
);

ALTER TABLE "public"."helicone_proxy_key_limits" 
ADD CONSTRAINT chk_timewindow_count 
CHECK (
    (timewindow_seconds IS NOT NULL AND count IS NOT NULL) OR 
    (timewindow_seconds IS NULL AND count IS NULL)
);

ALTER TABLE "public"."helicone_proxy_key_limits" 
ADD CONSTRAINT chk_not_all_null 
CHECK (
    cost IS NOT NULL OR 
    currency IS NOT NULL OR 
    timewindow_seconds IS NOT NULL OR 
    count IS NOT NULL
);
