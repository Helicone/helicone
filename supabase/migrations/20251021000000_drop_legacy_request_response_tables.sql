-- Drop legacy request and response tables and their foreign key constraints
-- ============================================================================
--
-- CONTEXT: These tables were used before the ClickHouse migration (2023-2024).
-- All new request/response data is now stored exclusively in ClickHouse's
-- request_response_rmt table. No new inserts have been happening to these
-- Postgres tables for months.
--
-- TABLES BEING DROPPED:
-- 1. request, response - Legacy request/response storage (replaced by ClickHouse)
--    MAY CONTAIN OLD DATA on production, but it's no longer being read or written
-- 2. asset, cache_hits, feedback - Related legacy tables
-- 3. prompt_input_record - Part of DEPRECATED PromptManager system
--    (marked DEPRECATED at valhalla/jawn/src/managers/prompt/PromptManager.ts:805-806)
--    New system uses prompts_2025_inputs instead
--    Legacy prompt UI (?legacy=true) will break but this is acceptable
--
-- SAFETY:
-- - Tables contain only legacy/deprecated data that is no longer accessed
-- - All FK constraints are explicitly dropped first (no CASCADE operations)
-- - Code has been updated to use ClickHouse or new prompt system
-- - No active reads or writes to these tables
--
-- ROLLBACK PLAN:
-- If issues are found after deployment:
-- 1. Restore tables from backup
-- 2. Revert code changes in VersionedRequestStore.ts, RequestManager.ts, ScoreStore.ts
-- 3. Re-run old migration to recreate tables and constraints
--
-- CODE CHANGES MADE:
-- - valhalla/jawn/src/lib/stores/request/VersionedRequestStore.ts
--   (fixed addPropertyToRequest to use ClickHouse)
-- - valhalla/jawn/src/managers/request/RequestManager.ts
--   (updated waitForRequestAndResponse to use ClickHouse)
-- - valhalla/jawn/src/lib/stores/ScoreStore.ts
--   (fixed array mapping bug, deprecated bumpRequestVersion)
--
-- KNOWN LIMITATIONS:
-- - Legacy prompt UI (?legacy=true) will no longer work
-- - Some experiment-related code may reference these tables but is likely unused

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
