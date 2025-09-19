import {
  buildRequestBody,
  authenticateRequest,
  buildErrorMessage,
} from "@helicone-package/cost/models/provider-helpers";
import { RequestWrapper } from "../RequestWrapper";
import { toAnthropic } from "../clients/llmmapper/providers/openai/request/toAnthropic";
import { isErr, Result, ok, err } from "../util/results";
import { Attempt, EscrowInfo, AttemptError } from "./types";
import { Endpoint } from "@helicone-package/cost/models/types";
import { ProviderKey } from "../db/ProviderKeysStore";

export class AttemptExecutor {
  constructor(
    private readonly env: Env,
    private readonly ctx: ExecutionContext
  ) {}

  async execute(
    attempt: Attempt,
    requestWrapper: RequestWrapper,
    parsedBody: any,
    orgId: string,
    forwarder: (
      targetBaseUrl: string | null,
      escrowInfo?: EscrowInfo
    ) => Promise<Response>
  ): Promise<Result<Response, AttemptError>> {
    const { endpoint, providerKey, source } = attempt;

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
      requestWrapper,
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
    requestWrapper: RequestWrapper,
    forwarder: (
      targetBaseUrl: string | null,
      escrowInfo?: EscrowInfo
    ) => Promise<Response>,
    escrowInfo: EscrowInfo | undefined
  ): Promise<Result<Response, AttemptError>> {
    try {
      // Build request body using provider helpers
      const bodyResult = await buildRequestBody(endpoint, {
        parsedBody,
        bodyMapping: requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
        toAnthropic: toAnthropic, // TODO: This is global, don't pass it in
      });

      if (isErr(bodyResult) || !bodyResult.data) {
        return err({
          type: "request_failed",
          message: bodyResult.error || "Failed to build request body",
          statusCode: 400,
        });
      }

      // Set up authentication headers using provider helpers
      const authResult = await authenticateRequest(endpoint, {
        config: (providerKey.config as any) || {},
        apiKey: providerKey.decrypted_provider_key,
        secretKey: providerKey.decrypted_provider_secret_key || undefined,
        bodyMapping: requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
        requestMethod: requestWrapper.getMethod(),
        requestUrl: endpoint.baseUrl ?? requestWrapper.url.toString(),
        requestBody: bodyResult.data,
      });

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
      requestWrapper.setUrl(endpoint.baseUrl ?? requestWrapper.url.toString());
      await requestWrapper.setBody(bodyResult.data);

      // Apply auth headers from provider
      for (const [key, value] of Object.entries(
        authResult.data?.headers || {}
      )) {
        requestWrapper.setHeader(key, value);
      }

      // Forward the request
      const response = await forwarder(endpoint.baseUrl, escrowInfo);

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
