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
import { SCALE_FACTOR, Wallet } from "../lib/durableObjects/Wallet";

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

      const cloudBillingEnabled =
        requestWrapper.heliconeHeaders.cloudBillingEnabled;
      let inflightRequestId = crypto.randomUUID();
      if (cloudBillingEnabled) {
        const walletId = env.WALLET.idFromName(orgId);
        const walletStub = env.WALLET.get(walletId);
        const billingCheck = await checkCloudBilling(orgId, walletStub);
        if (!billingCheck.shouldAllowRequest) {
          return createErrorResponse(
            billingCheck.reason,
            "CLOUD_BILLING_ERROR",
            429
          );
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
            console.error(
              `Failed to remove inflight request ${inflightRequestId}:`,
              err
            );
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

function getMaxInflightAllowed(balanceInCents: number): number {
  // Thresholds (amounts are in cents)
  const TEN_DOLLARS = 1_000;
  const TWENTY_DOLLARS = 2_000;
  const ONE_HUNDRED_DOLLARS = 10_000;
  const FIVE_HUNDRED_DOLLARS = 50_000;

  const MAX_INFLIGHT_UNDER_TEN = 0;
  const MAX_INFLIGHT_UNDER_TWENTY = 5;
  const MAX_INFLIGHT_UNDER_HUNDRED = 10;
  const MAX_INFLIGHT_UNDER_FIVE_HUNDRED = 100;
  const MAX_INFLIGHT_OVER_FIVE_HUNDRED = 500;

  if (balanceInCents < TEN_DOLLARS) return MAX_INFLIGHT_UNDER_TEN;
  if (balanceInCents < TWENTY_DOLLARS) return MAX_INFLIGHT_UNDER_TWENTY;
  if (balanceInCents < ONE_HUNDRED_DOLLARS) return MAX_INFLIGHT_UNDER_HUNDRED;
  if (balanceInCents < FIVE_HUNDRED_DOLLARS)
    return MAX_INFLIGHT_UNDER_FIVE_HUNDRED;
  return MAX_INFLIGHT_OVER_FIVE_HUNDRED;
}

async function checkCloudBilling(
  orgId: string,
  walletStub: DurableObjectStub<Wallet>
): Promise<CloudBillingCheckResult> {
  const walletState = await walletStub.getWalletState(orgId);
  const balanceInCents = Math.floor((walletState.balance ?? 0) / SCALE_FACTOR);
  if (balanceInCents <= 10) {
    return {
      shouldAllowRequest: false,
      reason: "Balance too low",
      balance: walletState.balance,
      inflightCount: walletState.inflightCount,
    };
    // TODO(ENG-2693): allow request based off max possible total cost of the model,
    // assuming max output tokens + actual input tokens (heuristically estimate?)
  }

  let maxInflightAllowed = getMaxInflightAllowed(balanceInCents);
  if (walletState.unknownCostCount > 0) {
    maxInflightAllowed = Math.floor(maxInflightAllowed / 2);
    const allowed = walletState.inflightCount <= maxInflightAllowed;
    return {
      shouldAllowRequest: allowed,
      reason: allowed
        ? ""
        : `Unknown cost detected. Please report this support@helicone.ai. Reduced limits (${maxInflightAllowed} inflight requests) enforced.`,
      balance: walletState.balance,
      inflightCount: walletState.inflightCount,
    };
  }

  const allowed = walletState.inflightCount <= maxInflightAllowed;
  return {
    shouldAllowRequest: allowed,
    reason: allowed
      ? ""
      : `Too many active requests (${walletState.inflightCount}/${maxInflightAllowed} allowed)`,
    balance: walletState.balance,
    inflightCount: walletState.inflightCount,
  };
}
