-- Drop legacy request and response tables and their foreign key constraints
-- These tables were used before ClickHouse migration and are no longer needed
-- All data is now stored in ClickHouse (request_response_rmt table)
-- Note: Avoiding CASCADE to prevent performance issues with large datasets
--
-- IMPORTANT: The following code files have been updated to work without these tables:
-- - valhalla/jawn/src/lib/stores/request/VersionedRequestStore.ts (deprecated putPropertyAndBumpVersion)
-- - valhalla/jawn/src/managers/request/RequestManager.ts (updated waitForRequestAndResponse to use ClickHouse)
-- - valhalla/jawn/src/lib/stores/ScoreStore.ts (deprecated bumpRequestVersion)
-- - valhalla/jawn/src/managers/inputs/InputsManager.ts (removed request/response table joins)
--
-- WARNING: The following files may still reference these tables and may need updates:
-- - valhalla/jawn/src/lib/stores/experimentStore.ts
-- - valhalla/jawn/src/lib/stores/request/request.ts (getRequests function - likely unused)
-- - valhalla/jawn/src/managers/dataset/DatasetManager.ts
-- - valhalla/jawn/src/managers/experiment/ExperimentV2Manager.ts
-- Monitor for errors after deployment and update these files if needed.

-- First, drop any legacy views that might reference these tables
DROP VIEW IF EXISTS response_and_request;
DROP VIEW IF EXISTS response_rbac;
DROP VIEW IF EXISTS request_rbac;
DROP VIEW IF EXISTS user_metrics_rbac;
DROP VIEW IF EXISTS metrics_rbac;
DROP VIEW IF EXISTS response_and_request_rbac;
DROP VIEW IF EXISTS request_cache_rbac;

-- Drop foreign key constraints from dependent tables (request/response references)
ALTER TABLE experiment_output DROP CONSTRAINT IF EXISTS public_experiment_output_request_id_fkey;
ALTER TABLE experiment_v2_hypothesis_run DROP CONSTRAINT IF EXISTS public_experiment_v2_hypothesis_run_result_request_id_fkey;
ALTER TABLE finetune_dataset_data DROP CONSTRAINT IF EXISTS finetune_dataset_data_request_id_fkey;
ALTER TABLE job_node_request DROP CONSTRAINT IF EXISTS job_node_request_request_id_fkey;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_request_id_fkey;
ALTER TABLE request_job_task DROP CONSTRAINT IF EXISTS request_job_task_request_id_fkey;
ALTER TABLE score_value DROP CONSTRAINT IF EXISTS fk_request_id;

-- Drop foreign key constraints pointing to prompt_input_record (deprecated prompt system)
ALTER TABLE experiment_dataset_v2_row DROP CONSTRAINT IF EXISTS public_experiment_dataset_v2_row_input_record_fkey;
ALTER TABLE experiment_output DROP CONSTRAINT IF EXISTS public_experiment_output_input_record_id_fkey;

-- Drop legacy tables (no longer used, all data in ClickHouse or new prompt system)
DROP TABLE IF EXISTS asset;
DROP TABLE IF EXISTS cache_hits;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS prompt_input_record;  -- Part of deprecated PromptManager, replaced by prompts_2025_inputs
DROP TABLE IF EXISTS response;
DROP TABLE IF EXISTS request;
