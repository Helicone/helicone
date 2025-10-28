import { createClient } from "@supabase/supabase-js";
import { Database } from "../../supabase/database.types";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";
import { SimpleAIGateway } from "../lib/ai-gateway/SimpleAIGateway";
import { GatewayMetrics } from "../lib/ai-gateway/GatewayMetrics";
import { getDataDogClient } from "../lib/monitoring/DataDogClient";
import { DBWrapper } from "../lib/db/DBWrapper";
import { HeliconeHeaders } from "../lib/models/HeliconeHeaders";

export const getAIGatewayRouter = (router: BaseRouter) => {
  router.post(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      requestWrapper.setRequestReferrer("ai-gateway");

      try {
        const pathLower = new URL(requestWrapper.getUrl()).pathname.toLowerCase();
        const existingMapping = requestWrapper.headers.get(
          "Helicone-Gateway-Body-Mapping"
        );
        if ((!existingMapping || existingMapping === "OPENAI") && pathLower.includes("v1/responses")) {
          const headers = new Headers(requestWrapper.headers);
          headers.set("Helicone-Gateway-Body-Mapping", "RESPONSES");
          requestWrapper.remapHeaders(headers);
          requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping = "RESPONSES";
        }
      } catch (_e) {
        // ignore URL parsing issues
      }

      // Authenticate first
      const isEU = requestWrapper.isEU();
      const supabaseClient = isEU
        ? createClient<Database>(
            env.EU_SUPABASE_URL,
            env.EU_SUPABASE_SERVICE_ROLE_KEY
          )
        : createClient<Database>(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY
          );

      const rawAPIKey = requestWrapper.getRawProviderAuthHeader();
      const hashedAPIKey = await requestWrapper.getProviderAuthHeader();

      if (!hashedAPIKey) {
        return new Response("Invalid Helicone API key (hshed)", {
          status: 401,
        });
      }

      const { data: auth, error: authError } = await requestWrapper.auth();

      if (authError || !auth || !rawAPIKey) {
        console.error(authError);
        return new Response("Invalid Helicone API key", { status: 401 });
      }

      const db = new DBWrapper(env, auth);
      const { data: orgData, error: orgError } = await db.getAuthParams();
      if (orgError || !orgData) {
        return new Response("Organization not found", { status: 401 });
      }

      const dataDogClient = getDataDogClient(env);
      const metrics = new GatewayMetrics(dataDogClient);

      // Create gateway with authenticated context
      const gateway = new SimpleAIGateway(
        requestWrapper,
        env,
        ctx,
        {
          orgId: orgData?.organizationId,
          apiKey: rawAPIKey,
          supabaseClient,
          orgMeta: orgData?.metaData,
        },
        metrics
      );

      return gateway.handle();
    }
  );

  // Catch-all for non-POST methods
  router.all("*", async () => {
    return new Response(
      "Method not allowed. AI Gateway only accepts POST requests.",
      {
        status: 405,
        headers: {
          Allow: "POST",
        },
      }
    );
  });

  return router;
};
