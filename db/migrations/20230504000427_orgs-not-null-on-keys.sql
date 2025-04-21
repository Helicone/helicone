
-- BACKFILL ORGS PART 1
-- WITH personal_orgs AS (
--   SELECT "owner", COUNT(*) as org_count
--   FROM "public"."organization"
--   WHERE "is_personal" = TRUE
--   GROUP BY "owner"
-- )
-- INSERT INTO "public"."organization" ("name", "owner", "is_personal")
-- SELECT 'Personal', users.id, TRUE
-- FROM auth.users AS users
-- LEFT JOIN personal_orgs ON users.id = personal_orgs."owner"
-- WHERE personal_orgs.org_count IS NULL;


-- BACKFILL ORGS PART 2
-- UPDATE public.helicone_api_keys
-- SET organization_id = personal_orgs.id
-- FROM (
--   SELECT org.id, org."owner"
--   FROM "public"."organization" org
--   WHERE org."is_personal" = TRUE
-- ) AS personal_orgs
-- WHERE helicone_api_keys.user_id = personal_orgs."owner"
--   AND helicone_api_keys.organization_id IS NULL;


alter table "public"."helicone_api_keys" alter column "organization_id" set not null;
