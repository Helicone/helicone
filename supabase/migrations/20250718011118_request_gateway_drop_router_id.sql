ALTER TABLE "public"."request" DROP COLUMN IF EXISTS gateway_router_id;
ALTER TABLE "public"."request" DROP COLUMN IF EXISTS gateway_deployment_target;

ALTER TABLE "public"."request" DROP CONSTRAINT IF EXISTS "request_gateway_router_id_fkey";
