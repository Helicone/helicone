import {
  authenticateRequest,
  buildEndpointUrl,
  buildErrorMessage,
  buildRequestBody,
} from "@helicone-package/cost/models/provider-helpers";
import {
  AuthContext,
  Endpoint,
  Plugin,
  RequestParams,
} from "@helicone-package/cost/models/types";
import { toAnthropic } from "@helicone-package/llm-mapper/transform/providers/openai/request/toAnthropic";
import { CacheProvider } from "../../../../packages/common/cache/provider";
import { ProviderKey } from "../db/ProviderKeysStore";
import {
  createDataDogTracer,
  DataDogTracer,
  TraceContext,
} from "../monitoring/DataDogTracer";
import { RequestWrapper } from "../RequestWrapper";
import { err, isErr, ok, Result } from "../util/results";
import { GatewayMetrics } from "./GatewayMetrics";
import { Attempt, AttemptError, EscrowInfo } from "./types";
import { toChatCompletions } from "@helicone-package/llm-mapper/transform/providers/responses/request/toChatCompletions";

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
  };
  traceContext: TraceContext | null;
}

export class AttemptExecutor {
  constructor(
    private readonly env: Env,
    private readonly ctx: ExecutionContext,
    private readonly cacheProvider: CacheProvider,
    private readonly tracer: DataDogTracer
  ) { }

  async PTBPreCheck(props: {
    attempt: Attempt;
    requestWrapper: RequestWrapper;
    orgId: string;
    orgMeta: ExecutorProps["orgMeta"];
    traceContext?: TraceContext | null;
  }): Promise<
    Result<
      {
        reservedEscrowId: string;
      },
      AttemptError
    >
  > {
    // Start wallet operation span
    const walletSpanId = props.traceContext?.sampled
      ? this.tracer.startSpan(
        "ai_gateway.ptb.credit_validation.reserve_escrow",
        "reserveEscrow",
        "helicone-wallet",
        {
          operation: "reserve_escrow",
        },
        props.traceContext
      )
      : null;

    const escrowResult = await this.reserveEscrow(
      props.attempt,
      props.requestWrapper.heliconeHeaders.requestId,
      props.orgId,
      props.orgMeta
    );

    if (isErr(escrowResult)) {
      if (walletSpanId) {
        this.tracer.setError(walletSpanId, escrowResult.error.message);
        this.tracer.finishSpan(walletSpanId);
      }

      return err({
        type:
          (escrowResult.error.statusCode || 500) === 429
            ? "insufficient_credit_limit"
            : "request_failed",
        message: escrowResult.error.message,
        statusCode: escrowResult.error.statusCode || 500,
      });
    }

    // Finish wallet span with success tags
    if (walletSpanId) {
      this.tracer.setTag(walletSpanId, "escrow_id", escrowResult.data.escrowId);
      this.tracer.finishSpan(walletSpanId);
    }

    return ok({ reservedEscrowId: escrowResult.data.escrowId });
  }

  async execute(props: ExecutorProps): Promise<Result<Response, AttemptError>> {
    const { endpoint, providerKey } = props.attempt;

    let escrowInfo: EscrowInfo | undefined;
    let ptbSpanId: string | null = null;

    // Start PTB span for PTB requests
    if (props.attempt.authType === "ptb" && endpoint.ptbEnabled) {
      ptbSpanId = props.traceContext?.sampled
        ? this.tracer.startSpan(
          "ai_gateway.ptb",
          `${props.requestWrapper.getMethod()} ${props.requestWrapper.getUrl()}`,
          "ai-gateway-ptb",
          {
            provider: endpoint.provider,
            model: endpoint.providerModelId,
            http_method: props.requestWrapper.getMethod(),
          },
          props.traceContext
        )
        : null;
    }

    // Reserve escrow if needed (PTB only)
    if (props.attempt.authType === "ptb" && endpoint.ptbEnabled) {
      const ptbCheck = await this.PTBPreCheck({
        ...props,
      });

      if (isErr(ptbCheck)) {
        // Finish PTB span with error
        if (ptbSpanId) {
          this.tracer.setError(ptbSpanId, ptbCheck.error.message);
          this.tracer.finishSpan(ptbSpanId, {
            http_status_code: ptbCheck.error.statusCode?.toString(),
          });
        }
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
      props.attempt.plugins,
      props.traceContext
    );

    // If error, cancel escrow and return the error
    if (isErr(result)) {
      if (escrowInfo) {
        this.ctx.waitUntil(this.cancelEscrow(escrowInfo.escrowId, props.orgId));
      }

      // Finish PTB span with error
      if (ptbSpanId) {
        this.tracer.setError(ptbSpanId, result.error.message);
        this.tracer.finishSpan(ptbSpanId, {
          http_status_code: result.error.statusCode?.toString(),
        });
      }

      return result;
    }

    // Success - finish PTB span
    if (ptbSpanId) {
      this.tracer.finishSpan(ptbSpanId, {
        http_status_code: result.data.status.toString(),
      });
    }

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
    plugins?: Plugin[],
    traceContext?: TraceContext | null
  ): Promise<Result<Response, AttemptError>> {
    const bodyMapping = endpoint.userConfig.gatewayMapping || requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping;
    try {
      const bodyResult = await buildRequestBody(endpoint, {
        parsedBody,
        bodyMapping: bodyMapping,
        toAnthropic: (body, modelId, options) =>
          toAnthropic(body, modelId, plugins, options),
        toChatCompletions: (body) => toChatCompletions(body),
      });

      if (isErr(bodyResult) || !bodyResult.data) {
        return err({
          type: "request_failed",
          message: bodyResult.error || "Failed to build request body",
          statusCode: 400,
        });
      }

      requestParams.apiKey = providerKey.decrypted_provider_key;
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
        bodyMapping: bodyMapping,
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

      // Apply auth headers from provider
      const authHeaders = authResult.data?.headers || {};
      for (const [key, value] of Object.entries(authHeaders)) {
        requestWrapper.setHeader(key, value);
      }

      // If provider doesn't return Authorization header, remove the original one
      // This handles providers that use URL-based auth (like Google's native API)
      if (!('Authorization' in authHeaders)) {
        requestWrapper.getHeaders().delete('Authorization');
      }

      metrics.markPreRequestEnd();
      metrics.markProviderStart();

      // Start provider request span
      const providerSpanId = traceContext?.sampled
        ? this.tracer.startSpan(
          `ai_gateway.${endpoint.ptbEnabled ? "ptb" : "byok"
          }.provider.llm_request`,
          `${endpoint.provider} ${endpoint.providerModelId}`,
          "llm-provider",
          {
            provider: endpoint.provider,
            model: endpoint.providerModelId,
          },
          traceContext
        )
        : null;

      const providerStartTime = Date.now();
      const response = await forwarder(urlResult.data, escrowInfo);
      const providerLatency = Date.now() - providerStartTime;

      metrics.markProviderEnd(response.status);

      // Finish provider span
      if (providerSpanId) {
        this.tracer.setTag(
          providerSpanId,
          "http.status_code",
          response.status.toString()
        );
        this.tracer.setTag(
          providerSpanId,
          "provider.latency_ms",
          providerLatency
        );
        if (!response.ok) {
          this.tracer.setTag(providerSpanId, "error", "true");
        }
        this.tracer.finishSpan(providerSpanId);
      }

      if (!response.ok) {
        // Detect Helicone-generated rate limit responses
        const heliconeError = response.headers.get("X-Helicone-Error");
        const errorMessageResult = await buildErrorMessage(endpoint, response);
        if (isErr(errorMessageResult)) {
          return err({
            type:
              response.status === 429 && heliconeError === "rate_limited"
                ? "rate_limited"
                : "request_failed",
            message: errorMessageResult.error,
            statusCode: response.status,
          });
        }

        return err({
          type:
            response.status === 429 && heliconeError === "rate_limited"
              ? "rate_limited"
              : "request_failed",
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
}
