import { createClient } from "@supabase/supabase-js";
import { Database } from "../../supabase/database.types";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";
import { SimpleAIGateway } from "../lib/ai-gateway/SimpleAIGateway";
import { GatewayMetrics } from "../lib/ai-gateway/GatewayMetrics";
import { getDataDogClient } from "../lib/monitoring/DataDogClient";
import { DBWrapper } from "../lib/db/DBWrapper";
import { createDataDogTracer } from "../lib/monitoring/DataDogTracer";
import { registry } from "@helicone-package/cost/models/registry";

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
        const pathLower = new URL(
          requestWrapper.getUrl()
        ).pathname.toLowerCase();
        const existingMapping = requestWrapper.headers.get(
          "Helicone-Gateway-Body-Mapping"
        );
        if (
          (!existingMapping || existingMapping === "OPENAI") &&
          pathLower.includes("v1/responses")
        ) {
          const headers = new Headers(requestWrapper.headers);
          headers.set("Helicone-Gateway-Body-Mapping", "RESPONSES");
          requestWrapper.remapHeaders(headers);
          requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping =
            "RESPONSES";
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

      // Initialize DataDog tracer for timing instrumentation
      const tracer = createDataDogTracer(env);
      const traceContext = tracer.startTrace(
        "ai_gateway",
        requestWrapper.getUrl(),
        {
          http_method: requestWrapper.getMethod(),
        }
      );

      const rawAPIKey = requestWrapper.getRawProviderAuthHeader();

      // Timing: Hash API key
      const hashSpan = tracer.startSpan(
        "ai_gateway.auth.hash_api_key",
        "getProviderAuthHeader",
        "ai-gateway",
        {},
        traceContext || undefined
      );
      const hashedAPIKey = await requestWrapper.getProviderAuthHeader();
      tracer.finishSpan(hashSpan);

      if (!hashedAPIKey) {
        tracer.finishTrace({ error: "invalid_hashed_key" });
        ctx.waitUntil(tracer.sendTrace());
        return new Response("Invalid Helicone API key (hshed)", {
          status: 401,
        });
      }

      // Timing: Validate API key
      const authSpan = tracer.startSpan(
        "ai_gateway.auth.validate_key",
        "requestWrapper.auth",
        "ai-gateway",
        {},
        traceContext || undefined
      );
      const { data: auth, error: authError } = await requestWrapper.auth();
      tracer.finishSpan(authSpan);

      if (authError || !auth || !rawAPIKey) {
        console.error(authError);
        tracer.setError(authSpan, authError?.toString() || "Invalid API key");
        tracer.finishTrace({ error: "auth_failed" });
        ctx.waitUntil(tracer.sendTrace());
        return new Response("Invalid Helicone API key", { status: 401 });
      }

      const db = new DBWrapper(env, auth);

      // Timing: Get auth params
      const dbSpan = tracer.startSpan(
        "ai_gateway.db.get_auth_params",
        "getAuthParams",
        "ai-gateway",
        {},
        traceContext || undefined
      );
      const { data: orgData, error: orgError } = await db.getAuthParams();
      tracer.finishSpan(dbSpan);
      if (orgError || !orgData) {
        tracer.finishTrace({ error: "org_not_found" });
        ctx.waitUntil(tracer.sendTrace());
        return new Response("Organization not found", { status: 401 });
      }

      // Set org_id as a core primitive for all spans in this trace
      tracer.setOrgId(orgData.organizationId);

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
        metrics,
        tracer,
        traceContext
      );

      const response = await gateway.handle();

      // Finish trace and send to DataDog
      tracer.finishTrace();
      ctx.waitUntil(tracer.sendTrace());

      return response;
    }
  );

  // GET /v1/models endpoint - OpenAI compatible
  router.get("/v1/models", async () => {
    try {
      const allModelsResult = registry.getAllModelsWithIds();
      if (allModelsResult.error) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Failed to fetch models from registry",
              type: "internal_error",
            },
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      interface OAIModel {
        id: string;
        object: "model";
        created: number;
        owned_by: string;
      }

      const dateToUnixTimestamp = (dateString?: string): number => {
        if (!dateString) {
          return Math.floor(new Date("2024-01-01").getTime() / 1000);
        }
        return Math.floor(new Date(dateString).getTime() / 1000);
      };

      const oaiModels: OAIModel[] = [];

      for (const [modelId, modelConfig] of Object.entries(
        allModelsResult.data!
      )) {
        const endpointsResult = registry.getEndpointsByModel(modelId);
        if (
          !endpointsResult.data ||
          endpointsResult.data.length === 0 ||
          endpointsResult.error
        ) {
          continue;
        }

        const allEndpointsRequireExplicitRouting = endpointsResult.data.every(
          (ep: any) => ep.modelConfig.requireExplicitRouting === true
        );
        if (allEndpointsRequireExplicitRouting) {
          continue;
        }

        oaiModels.push({
          id: modelId,
          object: "model",
          created: dateToUnixTimestamp((modelConfig as any).created),
          owned_by: (modelConfig as any).author,
        });
      }

      return new Response(
        JSON.stringify({
          object: "list",
          data: oaiModels,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error fetching models:", error);
      return new Response(
        JSON.stringify({
          error: {
            message: "Internal server error while fetching models",
            type: "internal_error",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  });

  // Catch-all for non-POST methods
  router.all("*", async () => {
    return new Response(
      "Method not allowed. AI Gateway only accepts POST requests.",
      {
        status: 405,
        headers: {
          Allow: "POST, GET",
        },
      }
    );
  });

  return router;
};
