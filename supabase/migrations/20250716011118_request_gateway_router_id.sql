ALTER TABLE "public"."request" ADD COLUMN gateway_router_id UUID;
ALTER TABLE "public"."request" ADD COLUMN gateway_deployment_target VARCHAR(255);

ALTER TABLE "public"."request" ADD CONSTRAINT "request_gateway_router_id_fkey" FOREIGN KEY (gateway_router_id) REFERENCES "public"."routers"("id") ON UPDATE CASCADE ON DELETE CASCADE;

