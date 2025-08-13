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
} from "../lib/util/aiGateway";
import { gatewayForwarder } from "./gatewayRouter";
import { ProviderKeysManager } from "../lib/managers/ProviderKeysManager";
import { ProviderKeysStore } from "../lib/db/ProviderKeysStore";
import { isErr } from "../lib/util/results";
import { PromptManager } from "../lib/managers/PromptManager";
import { HeliconePromptManager } from "@helicone-package/prompts/HeliconePromptManager";
import { PromptStore } from "../lib/db/PromptStore";
import { createErrorResponse } from "./generateRouter";

export const getAIGatewayRouter = (router: BaseRouter) => {
  router.all(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      function forwarder(targetBaseUrl: string | null) {
        return gatewayForwarder(
          {
            targetBaseUrl,
            setBaseURLOverride: (url) => {
              requestWrapper.setBaseURLOverride(url);
            },
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

      const cloudBillingEnabled = requestWrapper.heliconeHeaders.cloudBillingEnabled;
      let inflightRequestId = crypto.randomUUID();
      if (cloudBillingEnabled) {
        const walletId = env.WALLET.idFromName(orgId);
        const walletStub = env.WALLET.get(walletId);
        const billingCheck = await checkCloudBilling(orgId, walletStub);
        if (!billingCheck.shouldAllowRequest) {
          return createErrorResponse(billingCheck.reason, "CLOUD_BILLING_ERROR", 429);
        }
        
        // we do not want to re-using the helicone requestId, since we allow that
        // being specified externally, which we do NOT want here. 
        await walletStub.addInflightRequest(inflightRequestId);
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
      });

      // decrement the inflight request count
      if (cloudBillingEnabled) {
        const walletId = env.WALLET.idFromName(orgId);
        const walletStub = env.WALLET.get(walletId);
        
        ctx.waitUntil(
          walletStub.removeInflightRequest(inflightRequestId).catch((err) => {
            console.error(`Failed to remove inflight request ${inflightRequestId}:`, err);
          })
        );
      }

      if (isErr(result)) {
        return new Response(result.error.message, {
          status: result.error.code,
        });
      }

      return result.data;
    }
  );

  return router;
};

interface CloudBillingCheckResult {
  shouldAllowRequest: boolean;
  reason: string;
  balance: number;
  inflightCount: number;
}

async function checkCloudBilling(
  orgId: string,
  walletStub: any
): Promise<CloudBillingCheckResult> {
  const { balance, inflightCount } = await walletStub.getBalanceAndInflightCount(orgId);
  
  // If balance is null (no wallet entry yet), treat as 0
  const balanceAmount = balance ?? 0;
  let shouldAllowRequest = false;
  let reason = "";

  if (balanceAmount < 1000) {
    // Less than $10 (1000 cents): only allow if no inflight requests
    shouldAllowRequest = inflightCount === 0;
    reason = inflightCount > 0
      ? `Balance too low (${balanceAmount} cents). Must have no active requests when balance is under $10.`
      : "";
  } else if (balanceAmount < 10000) {
    // $10-$100 (1000-9999 cents): allow up to 10 inflight requests
    shouldAllowRequest = inflightCount < 10;
    reason = inflightCount >= 10
      ? `Too many active requests (${inflightCount}/10 allowed) for balance of $${(balanceAmount/100).toFixed(2)}.`
      : "";
  } else if (balanceAmount < 50000) {
    // $100-$500 (10000-49999 cents): allow up to 100 inflight requests
    shouldAllowRequest = inflightCount < 100;
    reason = inflightCount >= 100
      ? `Too many active requests (${inflightCount}/100 allowed) for balance of $${(balanceAmount/100).toFixed(2)}.`
      : "";
  } else {
    // Over $500 (50000+ cents): allow up to 1000 inflight requests
    shouldAllowRequest = inflightCount < 1000;
    reason = inflightCount >= 1000
      ? `Too many active requests (${inflightCount}/1000 allowed).`
      : "";
  }

  return {
    shouldAllowRequest,
    reason,
    balance,
    inflightCount
  };
}
