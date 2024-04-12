CREATE TABLE "public"."prompt_v2" (
    id UUID PRIMARY KEY default gen_random_uuid(),
    user_defined_id TEXT NOT NULL,
    "description" TEXT,
    pretty_name TEXT,
    organization UUID NOT NULL,
    CONSTRAINT unique_user_defined_id UNIQUE (user_defined_id, organization),
    CONSTRAINT fk_organization FOREIGN KEY (organization) REFERENCES organization(id),
    CONSTRAINT check_user_defined_id_length CHECK (LENGTH(user_defined_id) <= 32),
    CONSTRAINT check_description_length CHECK (LENGTH(description) <= 512),
    CONSTRAINT check_pretty_name_length CHECK (LENGTH(pretty_name) <= 128)
);

alter table "public"."prompt_v2" enable row level security;

CREATE TABLE "public"."prompts_versions" (
    id UUID PRIMARY KEY default gen_random_uuid(),
    major_version INT NOT NULL,
    minor_version INT NOT NULL,
    soft_delete BOOLEAN DEFAULT FALSE,
    helicone_template JSONB,
    prompt_v2 UUID NOT NULL,
    model TEXT,
    organization UUID NOT NULL,
    CONSTRAINT fk_prompt FOREIGN KEY (prompt_v2) REFERENCES prompt_v2(id),
    CONSTRAINT fk_organization FOREIGN KEY (organization) REFERENCES organization(id),
    CONSTRAINT check_major_version CHECK (major_version >= 0),
    CONSTRAINT check_minor_version CHECK (minor_version >= 0)
);
CREATE INDEX idx_prompts_versions_major ON prompts_versions(organization, major_version DESC);
CREATE INDEX idx_prompts_versions_minor ON prompts_versions(organization, major_version DESC, minor_version DESC);
CREATE UNIQUE INDEX idx_prompts_versions_model ON prompts_versions(organization, prompt_v2, major_version DESC, minor_version DESC);

alter table "public"."prompts_versions" enable row level security;

CREATE TABLE  "public"."prompt_input_keys" (
    id UUID PRIMARY KEY default gen_random_uuid(),
    key TEXT NOT NULL,
    prompt_v2 UUID NOT NULL,
    CONSTRAINT fk_prompt FOREIGN KEY (prompt_v2) REFERENCES prompt_v2(id)
);

alter table "public"."prompt_input_keys" enable row level security;

CREATE TABLE "public"."prompt_input_record" (
    id UUID PRIMARY KEY default gen_random_uuid(),
    inputs JSONB NOT NULL,
    source_request UUID,
    CONSTRAINT fk_source_request FOREIGN KEY (source_request) REFERENCES request(id)
);

alter table "public"."prompt_input_record" enable row level security;

CREATE TABLE "public"."experiment_dataset_v2" (
    id UUID PRIMARY KEY default gen_random_uuid(),
    "name" TEXT
);

alter table "public"."experiment_dataset_v2" enable row level security;

CREATE TABLE "public"."experiment_dataset_v2_row" (
    id UUID PRIMARY KEY default gen_random_uuid(),
    input_record UUID,
    dataset_id UUID,
    CONSTRAINT fk_dataset_id FOREIGN KEY (dataset_id) REFERENCES experiment_dataset_v2(id)
);

alter table "public"."experiment_dataset_v2_row" enable row level security;

CREATE TABLE  "public"."experiment_v2" (
    id UUID PRIMARY KEY default gen_random_uuid(),
    dataset UUID,
    organization UUID,
    CONSTRAINT fk_dataset FOREIGN KEY (dataset) REFERENCES experiment_dataset_v2(id)
);

alter table "public"."experiment_v2" enable row level security;

CREATE TABLE  "public"."experiment_v2_hypothesis" (
    id UUID PRIMARY KEY default gen_random_uuid(),
    prompt_version UUID NOT NULL,
    model TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'CANCELLED', 'ERROR')),
    experiment_v2 UUID,
    CONSTRAINT fk_experiment FOREIGN KEY (experiment_v2) REFERENCES experiment_v2(id),
    CONSTRAINT fk_prompt_version FOREIGN KEY (prompt_version) REFERENCES prompts_versions(id)
);

alter table "public"."experiment_v2_hypothesis" enable row level security;

CREATE TABLE  experiment_v2_hypothesis_run (
    id UUID PRIMARY KEY default gen_random_uuid(),
    experiment_hypothesis UUID NOT NULL,
    dataset_row UUID NOT NULL,
    CONSTRAINT fk_experiment_hypothesis FOREIGN KEY (experiment_hypothesis) REFERENCES experiment_v2_hypothesis(id),
    CONSTRAINT fk_dataset_row FOREIGN KEY (dataset_row) REFERENCES experiment_dataset_v2_row(id)
);

alter table "public"."experiment_v2_hypothesis_run" enable row level security;

CREATE TABLE "public"."score_attribute" (
    id UUID PRIMARY KEY default gen_random_uuid(),
    score_key TEXT NOT NULL,
    organization UUID NOT NULL,
    CONSTRAINT unique_score_key UNIQUE (score_key, organization),
    CONSTRAINT fk_organization FOREIGN KEY (organization) REFERENCES organization(id)
);

alter table "public"."score_attribute" enable row level security;

CREATE TABLE "public"."score_value" (
    id UUID PRIMARY KEY default gen_random_uuid(),
    int_value BIGINT,
    score_attribute UUID NOT NULL,
    request_id UUID NOT NULL,
    CONSTRAINT fk_score_attribute FOREIGN KEY (score_attribute) REFERENCES score_attribute(id),
    CONSTRAINT fk_request_id FOREIGN KEY (request_id) REFERENCES request(id)
);

CREATE UNIQUE INDEX idx_score_value_request_id ON score_value(request_id, score_attribute);

alter table "public"."score_value" enable row level security;



