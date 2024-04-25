alter table "public"."experiment_v2_hypothesis_run" add column "result_request_id" uuid not null;

alter table "public"."experiment_v2_hypothesis_run" add constraint "public_experiment_v2_hypothesis_run_result_request_id_fkey" FOREIGN KEY (result_request_id) REFERENCES request(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."experiment_v2_hypothesis_run" validate constraint "public_experiment_v2_hypothesis_run_result_request_id_fkey";


