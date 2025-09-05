import { createClient } from "@supabase/supabase-js";
import { Database } from "../../supabase/database.types";
import { tryJSONParse } from "../lib/clients/llmmapper/llmmapper";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";
import { APIKeysStore } from "../lib/db/APIKeysStore";
import {
  getBody,
  authenticate,
  attemptModelRequestWithFallback,
  EscrowInfo,
} from "../lib/util/aiGateway";
import { gatewayForwarder } from "./gatewayRouter";
import { ProviderKeysManager } from "../lib/managers/ProviderKeysManager";
import { ProviderKeysStore } from "../lib/db/ProviderKeysStore";
import { isErr } from "../lib/util/results";
import { PromptManager } from "../lib/managers/PromptManager";
import { HeliconePromptManager } from "@helicone-package/prompts/HeliconePromptManager";
import { PromptStore } from "../lib/db/PromptStore";
import { errorForwarder } from "../lib/HeliconeProxyRequest/ErrorForwarder";

export const getAIGatewayRouter = (router: BaseRouter) => {
  router.all(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      requestWrapper.setRequestReferrer("ai-gateway");
      function forwarder(
        targetBaseUrl: string | null,
        escrowInfo?: EscrowInfo
      ) {
        return gatewayForwarder(
          {
            targetBaseUrl,
            setBaseURLOverride: (url) => {
              requestWrapper.setBaseURLOverride(url);
            },
            escrowInfo,
          },
          requestWrapper,
          env,
          ctx
        );
      }

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

      const { orgId, rawAPIKey } = await authenticate(
        requestWrapper,
        env,
        new APIKeysStore(supabaseClient)
      );

      if (!orgId || !rawAPIKey) {
        return new Response("Invalid API key", { status: 401 });
      }
      const body = await getBody(requestWrapper);
      const parsedBody = tryJSONParse(body ?? "{}");
      if (!parsedBody || !parsedBody.model) {
        return new Response("Invalid body or missing model", { status: 400 });
      }

      const models = parsedBody.model.split(",").map((m) => m.trim());

      const result = await attemptModelRequestWithFallback({
        models,
        requestWrapper,
        forwarder,
        providerKeysManager: new ProviderKeysManager(
          new ProviderKeysStore(supabaseClient),
          env
        ),
        promptManager: new PromptManager(
          new HeliconePromptManager({
            apiKey: rawAPIKey,
            baseUrl: env.VALHALLA_URL,
          }),
          new PromptStore(supabaseClient),
          env
        ),
        orgId,
        parsedBody,
        env,
        ctx,
      });

      if (isErr(result)) {
        requestWrapper.setBaseURLOverride("https://ai-gateway.helicone.ai");
        const errorResponse = await errorForwarder(requestWrapper, env, ctx, {
          code: result.error.type,
          message: result.error.message,
          statusCode: result.error.statusCode,
          details: result.error.details,
        });
        return errorResponse;
      }

      return result.data;
    }
  );

  return router;
};
