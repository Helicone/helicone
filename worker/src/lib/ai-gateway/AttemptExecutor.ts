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
}

export class AttemptExecutor {
  private tracer: DataDogTracer;

  constructor(
    private readonly env: Env,
    private readonly ctx: ExecutionContext,
    private readonly cacheProvider?: CacheProvider
  ) {
    this.tracer = createDataDogTracer(env);
  }

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
    // Start credit validation span
    const spanId = props.traceContext?.sampled
      ? this.tracer.startSpan(
          "ptb.credit_validation",
          "reserve_escrow",
          "helicone-wallet",
          {
            org_id: props.traceContext.tags.org_id,
          },
          props.traceContext
        )
      : null;

    const escrowResult = await this.reserveEscrow(
      props.attempt,
      props.requestWrapper.heliconeHeaders.requestId,
      props.orgId,
      props.orgMeta,
      props.traceContext
    );

    if (isErr(escrowResult)) {
      // Mark span with error
      if (spanId) {
        this.tracer.setTag(spanId, "wallet.escrow_status", "failed");
        this.tracer.setTag(spanId, "error_message", escrowResult.error.message);
        this.tracer.finishSpan(spanId);
      }

      return err({
        type: "request_failed",
        message: escrowResult.error.message,
        statusCode: escrowResult.error.statusCode || 500,
      });
    }

    // Mark span as successful
    if (spanId) {
      this.tracer.setTag(spanId, "wallet.escrow_status", "reserved");
      this.tracer.setTag(spanId, "escrow_id", escrowResult.data.escrowId);
      this.tracer.finishSpan(spanId);
    }

    return ok({ reservedEscrowId: escrowResult.data.escrowId });
  }

  async execute(props: ExecutorProps): Promise<Result<Response, AttemptError>> {
    const { endpoint, providerKey } = props.attempt;

    let escrowInfo: EscrowInfo | undefined;
    let traceContext: TraceContext | null = null;

    // Start trace for PTB requests
    if (props.attempt.authType === "ptb" && endpoint.ptbEnabled) {
      const resource = `${props.requestWrapper.getMethod()} ${props.requestWrapper.getUrl()}`;

      traceContext = this.tracer.startTrace("ptb.request", resource, {
        org_id: props.orgId || "unknown",
        provider: endpoint.provider,
        model: endpoint.providerModelId,
        http_method: props.requestWrapper.getMethod(),
      });
    }

    // Reserve escrow if needed (PTB only)
    if (props.attempt.authType === "ptb" && endpoint.ptbEnabled) {
      const ptbCheck = await this.PTBPreCheck({
        ...props,
        traceContext,
      });

      if (isErr(ptbCheck)) {
        // Finish trace with error
        if (traceContext?.sampled) {
          this.tracer.finishTrace({
            error: "true",
            error_message: ptbCheck.error.message,
            http_status_code: ptbCheck.error.statusCode?.toString(),
          });
          this.ctx.waitUntil(this.tracer.sendTrace());
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
      traceContext
    );

    // If error, cancel escrow and return the error
    if (isErr(result)) {
      if (escrowInfo) {
        this.ctx.waitUntil(this.cancelEscrow(escrowInfo.escrowId, props.orgId));
      }

      // Finish trace with error
      if (traceContext?.sampled) {
        this.tracer.finishTrace({
          error: "true",
          error_message: result.error.message,
          http_status_code: result.error.statusCode?.toString(),
        });
        this.ctx.waitUntil(this.tracer.sendTrace());
      }

      return result;
    }

    // Success - finish trace
    if (traceContext?.sampled) {
      this.tracer.finishTrace({
        http_status_code: result.data.status.toString(),
      });
      this.ctx.waitUntil(this.tracer.sendTrace());
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

      // Start provider request span
      const providerSpanId = traceContext?.sampled
        ? this.tracer.startSpan(
            "provider.llm_request",
            `${endpoint.provider} ${endpoint.providerModelId}`,
            "llm-provider",
            {
              org_id: traceContext.tags.org_id,
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
    },
    traceContext?: TraceContext | null
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
        },
        traceContext
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
