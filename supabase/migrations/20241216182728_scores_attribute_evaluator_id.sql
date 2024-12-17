alter table "public"."score_attribute" add column "evaluator_id" uuid;

alter table "public"."score_attribute" add constraint "public_score_attribute_evaluator_id_fkey" FOREIGN KEY (evaluator_id) REFERENCES evaluator(id) not valid;

alter table "public"."score_attribute" validate constraint "public_score_attribute_evaluator_id_fkey";


