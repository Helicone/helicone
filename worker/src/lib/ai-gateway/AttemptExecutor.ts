import {
  buildRequestBody,
  authenticateRequest,
  buildErrorMessage,
  buildEndpointUrl,
} from "@helicone-package/cost/models/provider-helpers";
import { RequestWrapper } from "../RequestWrapper";
import { toAnthropic } from "../clients/llmmapper/providers/openai/request/toAnthropic";
import { isErr, Result, ok, err } from "../util/results";
import { Attempt, EscrowInfo, AttemptError } from "./types";
import {
  AuthContext,
  Endpoint,
  RequestParams,
} from "@helicone-package/cost/models/types";
import { ProviderKey } from "../db/ProviderKeysStore";
import { CacheProvider } from "../../../../packages/common/cache/provider";

export class AttemptExecutor {
  constructor(
    private readonly env: Env,
    private readonly ctx: ExecutionContext,
    private readonly cacheProvider?: CacheProvider
  ) {}

  async execute(
    attempt: Attempt,
    requestWrapper: RequestWrapper,
    parsedBody: any,
    requestParams: RequestParams,
    orgId: string,
    forwarder: (
      targetBaseUrl: string | null,
      escrowInfo?: EscrowInfo
    ) => Promise<Response>
  ): Promise<Result<Response, AttemptError>> {
    const { endpoint, providerKey } = attempt;

    let escrowInfo: EscrowInfo | undefined;

    // Reserve escrow if needed (PTB only)
    if (attempt.authType === "ptb" && endpoint.ptbEnabled) {
      const escrowResult = await this.reserveEscrow(
        attempt,
        requestWrapper.heliconeHeaders.requestId,
        orgId
      );

      if (isErr(escrowResult)) {
        return err({
          type: "request_failed",
          message: escrowResult.error.message,
          statusCode: escrowResult.error.statusCode || 500,
        });
      }

      // Build EscrowInfo once with all needed data
      escrowInfo = {
        escrowId: escrowResult.data.escrowId,
        endpoint: endpoint,
      };
    }

    const result = await this.executeRequestWithProvider(
      endpoint,
      providerKey,
      parsedBody,
      requestParams,
      requestWrapper,
      orgId,
      forwarder,
      escrowInfo
    );

    // If error, cancel escrow and return the error
    if (isErr(result)) {
      if (escrowInfo) {
        this.ctx.waitUntil(this.cancelEscrow(escrowInfo.escrowId, orgId));
      }
      return result;
    }

    // Success
    return result;
  }

  private async executeRequestWithProvider(
    endpoint: Endpoint,
    providerKey: ProviderKey,
    parsedBody: any,
    requestParams: RequestParams,
    requestWrapper: RequestWrapper,
    orgId: string,
    forwarder: (
      targetBaseUrl: string | null,
      escrowInfo?: EscrowInfo
    ) => Promise<Response>,
    escrowInfo: EscrowInfo | undefined
  ): Promise<Result<Response, AttemptError>> {
    try {
      const bodyResult = await buildRequestBody(endpoint, {
        parsedBody,
        bodyMapping: requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
        toAnthropic: toAnthropic,
      });

      if (isErr(bodyResult) || !bodyResult.data) {
        return err({
          type: "request_failed",
          message: bodyResult.error || "Failed to build request body",
          statusCode: 400,
        });
      }

      const urlResult = buildEndpointUrl(endpoint, requestParams);

      if (isErr(urlResult)) {
        return err({
          type: "request_failed",
          message: urlResult.error,
          statusCode: 400,
        });
      }

      const authContext: AuthContext = {
        apiKey: providerKey.decrypted_provider_key,
        secretKey: providerKey.decrypted_provider_secret_key || undefined,
        orgId: orgId,
        bodyMapping: requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
        requestMethod: requestWrapper.getMethod(),
        requestUrl: urlResult.data,
        requestBody: bodyResult.data,
      };

      const authResult = await authenticateRequest(
        endpoint,
        authContext,
        this.cacheProvider
      );

      if (authResult.error) {
        return err({
          type: "request_failed",
          message: `Authentication failed: ${authResult.error}`,
          statusCode: 401,
        });
      }

      // Apply headers and body to request wrapper
      requestWrapper.setHeader(
        "Helicone-Auth",
        requestWrapper.getAuthorization() ?? ""
      );
      requestWrapper.resetObject();
      requestWrapper.setUrl(urlResult.data);
      await requestWrapper.setBody(bodyResult.data);

      for (const [key, value] of Object.entries(
        authResult.data?.headers || {}
      )) {
        requestWrapper.setHeader(key, value);
      }

      const response = await forwarder(urlResult.data, escrowInfo);

      if (!response.ok) {
        const errorMessageResult = await buildErrorMessage(endpoint, response);
        if (isErr(errorMessageResult)) {
          return err({
            type: "request_failed",
            message: errorMessageResult.error,
            statusCode: response.status,
          });
        }

        return err({
          type: "request_failed",
          message: errorMessageResult.data,
          statusCode: response.status,
        });
      }

      return ok(response);
    } catch (error) {
      return err({
        type: "request_failed",
        message: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }

  private async reserveEscrow(
    attempt: Attempt,
    requestId: string,
    orgId: string
  ): Promise<
    Result<{ escrowId: string }, { statusCode?: number; message: string }>
  > {
    const { endpoint } = attempt;

    // Calculate max cost using first pricing tier
    const firstTierPricing = endpoint.pricing?.[0];
    if (
      !firstTierPricing ||
      !endpoint.contextLength ||
      !endpoint.maxCompletionTokens ||
      firstTierPricing.input === 0 ||
      firstTierPricing.output === 0
    ) {
      return err({
        message: `Cost not supported for ${endpoint.provider}/${endpoint.providerModelId}`,
      });
    }

    const maxPromptCost = endpoint.contextLength * firstTierPricing.input;
    const maxCompletionCost =
      endpoint.maxCompletionTokens * firstTierPricing.output;
    const worstCaseCost = maxPromptCost + maxCompletionCost;

    if (worstCaseCost <= 0) {
      return err({
        message: `Invalid cost calculation for ${endpoint.provider}/${endpoint.providerModelId}`,
      });
    }

    try {
      const walletId = this.env.WALLET.idFromName(orgId);
      const walletStub = this.env.WALLET.get(walletId);

      const escrowResult = await walletStub.reserveCostInEscrow(
        orgId,
        requestId,
        worstCaseCost
      );

      if (isErr(escrowResult)) {
        return err({
          statusCode: escrowResult.error.statusCode,
          message: escrowResult.error.message,
        });
      }

      return ok(escrowResult.data);
    } catch (error) {
      return err({
        message:
          error instanceof Error ? error.message : "Unknown escrow error",
      });
    }
  }

  private async cancelEscrow(escrowId: string, orgId: string): Promise<void> {
    try {
      const walletId = this.env.WALLET.idFromName(orgId);
      const walletStub = this.env.WALLET.get(walletId);
      await walletStub.cancelEscrow(escrowId);
    } catch (error) {
      console.error(`Failed to cancel escrow ${escrowId}:`, error);
    }
  }
}
