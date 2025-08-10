alter table "public"."experiment_dataset_v2_row" alter column "created_at" set not null;

alter table "public"."experiment_dataset_v2_row" alter column "dataset_id" set not null;

alter table "public"."experiment_dataset_v2_row" alter column "input_record" set not null;

alter table "public"."experiment_v2_hypothesis" add column "provider_key" uuid not null;

alter table "public"."experiment_dataset_v2_row" add constraint "public_experiment_dataset_v2_row_input_record_fkey" FOREIGN KEY (input_record) REFERENCES prompt_input_record(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."experiment_dataset_v2_row" validate constraint "public_experiment_dataset_v2_row_input_record_fkey";

alter table "public"."experiment_v2_hypothesis" add constraint "public_experiment_v2_hypothesis_provider_key_fkey" FOREIGN KEY (provider_key) REFERENCES provider_keys(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."experiment_v2_hypothesis" validate constraint "public_experiment_v2_hypothesis_provider_key_fkey";

alter table "public"."experiment_v2_hypothesis_run" add column "result_request_id" uuid not null;

alter table "public"."experiment_v2_hypothesis_run" add constraint "public_experiment_v2_hypothesis_run_result_request_id_fkey" FOREIGN KEY (result_request_id) REFERENCES request(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."experiment_v2_hypothesis_run" validate constraint "public_experiment_v2_hypothesis_run_result_request_id_fkey";
