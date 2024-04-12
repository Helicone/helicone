

CREATE OR REPLACE TABLE prompt (
    id UUID PRIMARY KEY,
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


CREATE TABLE prompts_versions (
    id UUID PRIMARY KEY,
    major_version INT NOT NULL,
    minor_version INT NOT NULL,
    soft_delete BOOLEAN DEFAULT FALSE,
    helicone_template JSONB,
    prompt UUID NOT NULL,
    model TEXT,
    organization UUID NOT NULL,
    CONSTRAINT fk_prompt FOREIGN KEY (prompt) REFERENCES prompt(id),
    CONSTRAINT fk_organization FOREIGN KEY (organization) REFERENCES organization(id),
    CONSTRAINT unique_version UNIQUE (organization, prompt, major_version, minor_version),
    CONSTRAINT check_major_version CHECK (major_version >= 0),
    CONSTRAINT check_minor_version CHECK (minor_version >= 0)
);
CREATE INDEX idx_prompts_versions_major ON prompts_versions(organization, major_version DESC);
CREATE INDEX idx_prompts_versions_minor ON prompts_versions(organization, major_version, minor_version DESC);


CREATE TABLE prompt_input_keys (
    id BIGINT PRIMARY KEY,
    key TEXT NOT NULL,
    prompt UUID NOT NULL,
    CONSTRAINT fk_prompt FOREIGN KEY (prompt) REFERENCES prompt(id)
);

CREATE TABLE prompt_input_record (
    id UUID PRIMARY KEY,
    inputs JSONB NOT NULL,
    source_request UUID,
    CONSTRAINT fk_source_request FOREIGN KEY (source_request) REFERENCES request(id)
);

CREATE TABLE experiment_dataset (
    id INT PRIMARY KEY,
    "name" TEXT
);

CREATE TABLE experiment_dataset_row (
    id INT PRIMARY KEY,
    input_record UUID,
    dataset_id INT,
    CONSTRAINT fk_dataset_id FOREIGN KEY (dataset_id) REFERENCES experiment_dataset(id)
);

CREATE TABLE experiment (
    id UUID PRIMARY KEY,
    dataset UUID,
    organization UUID,
    CONSTRAINT fk_dataset FOREIGN KEY (dataset) REFERENCES experiment_dataset(id)
);

CREATE TABLE experiment_hypothesis (
    id UUID PRIMARY KEY,
    prompt_version UUID NOT NULL,
    model TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'CANCELLED', 'ERROR')),
    experiment UUID,
    CONSTRAINT fk_experiment FOREIGN KEY (experiment) REFERENCES experiment(id),
    CONSTRAINT fk_prompt_version FOREIGN KEY (prompt_version) REFERENCES prompts_versions(id)
);

CREATE TABLE experiment_hypothesis_run (
    id UUID PRIMARY KEY,
    experiment_hypothesis UUID NOT NULL,
    dataset_row UUID NOT NULL,
    CONSTRAINT fk_experiment_hypothesis FOREIGN KEY (experiment_hypothesis) REFERENCES experiment_hypothesis(id),
    CONSTRAINT fk_dataset_row FOREIGN KEY (dataset_row) REFERENCES experiment_dataset_row(id)
);

CREATE TABLE score_attribute (
    id UUID PRIMARY KEY,
    score_key TEXT NOT NULL,
    organization UUID NOT NULL,
    CONSTRAINT unique_score_key UNIQUE (score_key, organization),
    CONSTRAINT fk_organization FOREIGN KEY (organization) REFERENCES organization(id)
);

CREATE TABLE score_value (
    int_value BIGINT,
    score_attribute UUID NOT NULL,
    request_id UUID NOT NULL,
    CONSTRAINT pk_score_value PRIMARY KEY (score_attribute, request_id),
    CONSTRAINT fk_score_attribute FOREIGN KEY (score_attribute) REFERENCES score_attribute(id),
    CONSTRAINT fk_request_id FOREIGN KEY (request_id) REFERENCES request(id)
);




