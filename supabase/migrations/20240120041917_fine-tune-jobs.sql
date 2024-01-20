create table "public"."finetune_dataset" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "filters" text,
    "organization_id" uuid not null
);


alter table "public"."finetune_dataset" enable row level security;

create table "public"."finetune_dataset_data" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "request_id" uuid not null,
    "organization_id" uuid not null
);

alter table "public"."finetune_dataset_data" enable row level security;

create table "public"."finetune_job" (
    "created_at" timestamp with time zone not null default now(),
    "dataset_id" uuid not null,
    "status" text not null,
    "finetune_job_id" text not null,
    "provider_key_id" uuid not null,
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null
);


alter table "public"."finetune_job" enable row level security;

CREATE UNIQUE INDEX finetune_dataset_pkey ON public.finetune_dataset USING btree (id);

CREATE UNIQUE INDEX finetune_job_pkey ON public.finetune_job USING btree (id);

CREATE UNIQUE INDEX finetuning_dataset_pkey ON public.finetune_dataset_data USING btree (id, request_id);

alter table "public"."finetune_dataset" add constraint "finetune_dataset_pkey" PRIMARY KEY using index "finetune_dataset_pkey";

alter table "public"."finetune_dataset_data" add constraint "finetuning_dataset_pkey" PRIMARY KEY using index "finetuning_dataset_pkey";

alter table "public"."finetune_job" add constraint "finetune_job_pkey" PRIMARY KEY using index "finetune_job_pkey";

alter table "public"."finetune_dataset" add constraint "finetune_dataset_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."finetune_dataset" validate constraint "finetune_dataset_organization_id_fkey";

alter table "public"."finetune_dataset_data" add constraint "finetune_dataset_data_id_fkey" FOREIGN KEY (id) REFERENCES finetune_dataset(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."finetune_dataset_data" validate constraint "finetune_dataset_data_id_fkey";

alter table "public"."finetune_dataset_data" add constraint "finetune_dataset_data_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."finetune_dataset_data" validate constraint "finetune_dataset_data_organization_id_fkey";

alter table "public"."finetune_dataset_data" add constraint "finetune_dataset_data_request_id_fkey" FOREIGN KEY (request_id) REFERENCES request(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."finetune_dataset_data" validate constraint "finetune_dataset_data_request_id_fkey";

alter table "public"."finetune_job" add constraint "finetune_job_dataset_id_fkey" FOREIGN KEY (dataset_id) REFERENCES finetune_dataset(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."finetune_job" validate constraint "finetune_job_dataset_id_fkey";

alter table "public"."finetune_job" add constraint "finetune_job_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."finetune_job" validate constraint "finetune_job_organization_id_fkey";

alter table "public"."finetune_job" add constraint "finetune_job_provider_key_id_fkey" FOREIGN KEY (provider_key_id) REFERENCES provider_keys(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."finetune_job" validate constraint "finetune_job_provider_key_id_fkey";

grant delete on table "public"."finetune_dataset" to "anon";

grant insert on table "public"."finetune_dataset" to "anon";

grant references on table "public"."finetune_dataset" to "anon";

grant select on table "public"."finetune_dataset" to "anon";

grant trigger on table "public"."finetune_dataset" to "anon";

grant truncate on table "public"."finetune_dataset" to "anon";

grant update on table "public"."finetune_dataset" to "anon";

grant delete on table "public"."finetune_dataset" to "authenticated";

grant insert on table "public"."finetune_dataset" to "authenticated";

grant references on table "public"."finetune_dataset" to "authenticated";

grant select on table "public"."finetune_dataset" to "authenticated";

grant trigger on table "public"."finetune_dataset" to "authenticated";

grant truncate on table "public"."finetune_dataset" to "authenticated";

grant update on table "public"."finetune_dataset" to "authenticated";

grant delete on table "public"."finetune_dataset" to "service_role";

grant insert on table "public"."finetune_dataset" to "service_role";

grant references on table "public"."finetune_dataset" to "service_role";

grant select on table "public"."finetune_dataset" to "service_role";

grant trigger on table "public"."finetune_dataset" to "service_role";

grant truncate on table "public"."finetune_dataset" to "service_role";

grant update on table "public"."finetune_dataset" to "service_role";

grant delete on table "public"."finetune_dataset_data" to "anon";

grant insert on table "public"."finetune_dataset_data" to "anon";

grant references on table "public"."finetune_dataset_data" to "anon";

grant select on table "public"."finetune_dataset_data" to "anon";

grant trigger on table "public"."finetune_dataset_data" to "anon";

grant truncate on table "public"."finetune_dataset_data" to "anon";

grant update on table "public"."finetune_dataset_data" to "anon";

grant delete on table "public"."finetune_dataset_data" to "authenticated";

grant insert on table "public"."finetune_dataset_data" to "authenticated";

grant references on table "public"."finetune_dataset_data" to "authenticated";

grant select on table "public"."finetune_dataset_data" to "authenticated";

grant trigger on table "public"."finetune_dataset_data" to "authenticated";

grant truncate on table "public"."finetune_dataset_data" to "authenticated";

grant update on table "public"."finetune_dataset_data" to "authenticated";

grant delete on table "public"."finetune_dataset_data" to "service_role";

grant insert on table "public"."finetune_dataset_data" to "service_role";

grant references on table "public"."finetune_dataset_data" to "service_role";

grant select on table "public"."finetune_dataset_data" to "service_role";

grant trigger on table "public"."finetune_dataset_data" to "service_role";

grant truncate on table "public"."finetune_dataset_data" to "service_role";

grant update on table "public"."finetune_dataset_data" to "service_role";

grant delete on table "public"."finetune_job" to "anon";

grant insert on table "public"."finetune_job" to "anon";

grant references on table "public"."finetune_job" to "anon";

grant select on table "public"."finetune_job" to "anon";

grant trigger on table "public"."finetune_job" to "anon";

grant truncate on table "public"."finetune_job" to "anon";

grant update on table "public"."finetune_job" to "anon";

grant delete on table "public"."finetune_job" to "authenticated";

grant insert on table "public"."finetune_job" to "authenticated";

grant references on table "public"."finetune_job" to "authenticated";

grant select on table "public"."finetune_job" to "authenticated";

grant trigger on table "public"."finetune_job" to "authenticated";

grant truncate on table "public"."finetune_job" to "authenticated";

grant update on table "public"."finetune_job" to "authenticated";

grant delete on table "public"."finetune_job" to "service_role";

grant insert on table "public"."finetune_job" to "service_role";

grant references on table "public"."finetune_job" to "service_role";

grant select on table "public"."finetune_job" to "service_role";

grant trigger on table "public"."finetune_job" to "service_role";

grant truncate on table "public"."finetune_job" to "service_role";

grant update on table "public"."finetune_job" to "service_role";


create index "finetune_dataset_data_oir_idx" on "public"."finetune_dataset_data" ("organization_id", "id", "request_id");