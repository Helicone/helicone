import { createClient } from "@supabase/supabase-js";
import { Database } from "../../supabase/database.types";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";
import { APIKeysStore } from "../lib/db/APIKeysStore";
import { APIKeysManager } from "../lib/managers/APIKeysManager";
import { SimpleAIGateway } from "../lib/ai-gateway/SimpleAIGateway";
import { GatewayMetrics } from "../lib/ai-gateway/GatewayMetrics";
import { getDataDogClient } from "../lib/monitoring/DataDogClient";

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

      const apiKeysManager = new APIKeysManager(
        new APIKeysStore(supabaseClient),
        env
      );

      const rawAPIKey = requestWrapper.getRawProviderAuthHeader();
      const hashedAPIKey = await requestWrapper.getProviderAuthHeader();

      if (!hashedAPIKey) {
        return new Response("Invalid API key", { status: 401 });
      }

      const orgId = await apiKeysManager.getOrgIdWithFetch(hashedAPIKey);
      if (!orgId || !rawAPIKey) {
        return new Response("Invalid API key", { status: 401 });
      }

      const dataDogClient = getDataDogClient(env);
      const metrics = new GatewayMetrics(dataDogClient);

      // Create gateway with authenticated context
      const gateway = new SimpleAIGateway(requestWrapper, env, ctx, {
        orgId,
        apiKey: rawAPIKey,
        supabaseClient,
      }, metrics);

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
