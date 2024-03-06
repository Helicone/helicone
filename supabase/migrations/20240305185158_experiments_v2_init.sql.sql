create table prompt_variables (
    "id" uuid not null default gen_random_uuid() primary key,
    "prompt_id" uuid not null references prompts(id),
    "name" text not null,
    "soft_delete" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
);
create table prompt_value_sets (
    "id" uuid not null default gen_random_uuid() primary key,
    "prompt_id" uuid not null references prompts(id),
    "soft_delete" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
);
create table prompt_values (
    "id" uuid not null default gen_random_uuid() primary key,
    "prompt_id" uuid not null references prompts(id),
    "prompt_value_set_id" uuid not null references prompt_value_sets(id),
    "prompt_variable_id" uuid not null references prompt_variables(id),
    "value" text not null,
    "soft_delete" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
);
CREATE TABLE experiment_runs (
    "id" uuid not null default gen_random_uuid() primary key,
    "experiment_id" uuid not null references experiments(id),
    "prompt_id" uuid not null references prompts(id),
    "prompt_value_set_id" uuid not null references prompt_value_sets(id),
    "soft_delete" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
);