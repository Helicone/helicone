ALTER TABLE "public"."evaluator" ADD COLUMN "description" text;
ALTER TABLE "public"."evaluator" ADD COLUMN "model" varchar(64);
ALTER TABLE "public"."evaluator" ADD COLUMN "judge_config" jsonb;