import {
  buildRequestBody,
  authenticateRequest,
  buildErrorMessage,
  buildEndpointUrl,
} from "@helicone-package/cost/models/provider-helpers";
import { RequestWrapper } from "../RequestWrapper";
import { toAnthropic } from "@helicone-package/llm-mapper/transform/providers/openai/request/toAnthropic";
import { isErr, Result, ok, err } from "../util/results";
import { Plugin } from "@helicone-package/cost/models/types";
import { Attempt, EscrowInfo, AttemptError } from "./types";
import {
  AuthContext,
  Endpoint,
  RequestParams,
} from "@helicone-package/cost/models/types";
import { ProviderKey } from "../db/ProviderKeysStore";
import { CacheProvider } from "../../../../packages/common/cache/provider";
import { GatewayMetrics } from "./GatewayMetrics";

interface ExecutorProps {
  attempt: Attempt;
  requestWrapper: RequestWrapper;
  parsedBody: any;
  requestParams: RequestParams;
  orgId: string;
  forwarder: (
    targetBaseUrl: string | null,
    escrowInfo?: EscrowInfo
  ) => Promise<Response>;
  metrics: GatewayMetrics;
  orgMeta: {
    allowNegativeBalance: boolean;
    creditLimit: number;
    dangerouslyBypassWalletCheck: boolean;
  };
}

export class AttemptExecutor {
  constructor(
    private readonly env: Env,
    private readonly ctx: ExecutionContext,
    private readonly cacheProvider?: CacheProvider
  ) {}

  async PTBPreCheck(props: {
    attempt: Attempt;
    requestWrapper: RequestWrapper;
    orgId: string;
    orgMeta: ExecutorProps["orgMeta"];
  }): Promise<
    Result<
      {
        reservedEscrowId: string;
      },
      AttemptError
    >
  > {
    const escrowResult = await this.reserveEscrow(
      props.attempt,
      props.requestWrapper.heliconeHeaders.requestId,
      props.orgId,
      props.orgMeta
    );

    if (isErr(escrowResult)) {
      return err({
        type: "request_failed",
        message: escrowResult.error.message,
        statusCode: escrowResult.error.statusCode || 500,
      });
    }
    return ok({ reservedEscrowId: escrowResult.data.escrowId });
  }

  async execute(props: ExecutorProps): Promise<Result<Response, AttemptError>> {
    const { endpoint, providerKey } = props.attempt;

    let escrowInfo: EscrowInfo | undefined;

    // Reserve escrow if needed (PTB only)
    if (props.attempt.authType === "ptb" && endpoint.ptbEnabled) {
      const ptbCheck = await this.PTBPreCheck(props);

      if (isErr(ptbCheck)) {
        return err(ptbCheck.error);
      }

      escrowInfo = {
        escrowId: ptbCheck.data.reservedEscrowId,
        endpoint: endpoint,
      };
    }

    const result = await this.executeRequestWithProvider(
      endpoint,
      providerKey,
      props.parsedBody,
      props.requestParams,
      props.requestWrapper,
      props.orgId,
      props.forwarder,
      escrowInfo,
      props.metrics,
      props.attempt.plugins
    );

    // If error, cancel escrow and return the error
    if (isErr(result)) {
      if (escrowInfo) {
        this.ctx.waitUntil(this.cancelEscrow(escrowInfo.escrowId, props.orgId));
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
    escrowInfo: EscrowInfo | undefined,
    metrics: GatewayMetrics,
    plugins?: Plugin[]
  ): Promise<Result<Response, AttemptError>> {
    try {
      const bodyResult = await buildRequestBody(endpoint, {
        parsedBody,
        bodyMapping: requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
        toAnthropic: (body, modelId) => toAnthropic(body, modelId, plugins),
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

      // For AI Gateway: store original OpenAI format before converting to provider format
      // This allows the frontend to use OpenAI format without conversion
      if (endpoint.modelConfig.responseFormat !== "OPENAI") {
        requestWrapper.requestBodyBuffer.setOriginalOpenAIRequest(
          JSON.stringify(parsedBody)
        );
      }

      await requestWrapper.setBody(bodyResult.data);

      for (const [key, value] of Object.entries(
        authResult.data?.headers || {}
      )) {
        requestWrapper.setHeader(key, value);
      }

      metrics.markPreRequestEnd();
      metrics.markProviderStart();

      const response = await forwarder(urlResult.data, escrowInfo);

      metrics.markProviderEnd(response.status);

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
    orgId: string,
    orgMeta: {
      allowNegativeBalance: boolean;
      creditLimit: number;
      dangerouslyBypassWalletCheck: boolean;
    }
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
      if (orgMeta.dangerouslyBypassWalletCheck) {
        return ok({
          escrowId: "BYPASS_ESCROW",
        });
      }

      const escrowResult = await walletStub.reserveCostInEscrow(
        orgId,
        requestId,
        worstCaseCost,
        {
          enabled: orgMeta.allowNegativeBalance,
          limit: orgMeta.creditLimit,
        }
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

  private async getTotalDebits(orgId: string): Promise<number> {
    try {
      const walletId = this.env.WALLET.idFromName(orgId);
      const walletStub = this.env.WALLET.get(walletId);
      const result = await walletStub.getTotalDebits(orgId);
      return result.totalDebits;
    } catch (error) {
      console.error(`Failed to get total debits for org ${orgId}:`, error);
      return 0;
    }
  }
}
