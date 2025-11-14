import { RequestWrapper } from "../RequestWrapper";
import { PromptManager } from "../managers/PromptManager";
import { HeliconePromptManager } from "@helicone-package/prompts/HeliconePromptManager";
import { PromptStore } from "../db/PromptStore";
import { ProviderKeysManager } from "../managers/ProviderKeysManager";
import { ProviderKeysStore } from "../db/ProviderKeysStore";
import { tryJSONParse } from "../clients/llmmapper/llmmapper";
import { isErr, Result, ok, err } from "../util/results";
import { errorForwarder } from "../HeliconeProxyRequest/ErrorForwarder";
import { gatewayForwarder } from "../../routers/gatewayRouter";
import { AttemptBuilder } from "./AttemptBuilder";
import { AttemptExecutor } from "./AttemptExecutor";
import { Plugin } from "@helicone-package/cost/models/types";
import { Attempt, AttemptError, DisallowListEntry, EscrowInfo } from "./types";
import { ant2oaiResponse } from "../clients/llmmapper/router/oai2ant/nonStream";
import { ant2oaiStreamResponse } from "../clients/llmmapper/router/oai2ant/stream";
import {
  validateOpenAIChatPayload,
  validateOpenAIResponsePayload,
} from "./validators/openaiRequestValidator";
import {
  RequestParams,
  BodyMappingType,
} from "@helicone-package/cost/models/types";
import { SecureCacheProvider } from "../util/cache/secureCache";
import { GatewayMetrics } from "./GatewayMetrics";
import {
  toOpenAIResponse,
  toOpenAIStreamResponse,
} from "@helicone-package/llm-mapper/transform/providers/normalizeResponse";
import { DataDogTracer, TraceContext } from "../monitoring/DataDogTracer";
import { ResponsesAPIEnabledProviders } from "@helicone-package/cost/models/providers";
import { oaiChat2responsesResponse } from "../clients/llmmapper/router/oaiChat2responses/nonStream";
import { oaiChat2responsesStreamResponse } from "../clients/llmmapper/router/oaiChat2responses/stream";
import { validateProvider } from "@helicone-package/cost/models/provider-helpers";
import { ModelProviderName } from "@helicone-package/cost/models/providers";

export interface AuthContext {
  orgId: string;
  orgMeta: {
    allowNegativeBalance: boolean;
    creditLimit: number;
  };
  apiKey: string;
  supabaseClient: any;
}

export class SimpleAIGateway {
  private readonly attemptBuilder: AttemptBuilder;
  private readonly attemptExecutor: AttemptExecutor;
  private readonly orgId: string;
  private readonly apiKey: string;
  private readonly supabaseClient: any;
  private readonly metrics: GatewayMetrics;
  private readonly orgMeta: AuthContext["orgMeta"];
  private readonly tracer: DataDogTracer;
  private readonly traceContext: TraceContext | null;

  constructor(
    private readonly requestWrapper: RequestWrapper,
    private readonly env: Env,
    private readonly ctx: ExecutionContext,
    authContext: AuthContext,
    metrics: GatewayMetrics,
    tracer: DataDogTracer,
    traceContext: TraceContext | null
  ) {
    this.orgId = authContext.orgId;
    this.apiKey = authContext.apiKey;
    this.supabaseClient = authContext.supabaseClient;
    this.orgMeta = authContext.orgMeta;
    this.metrics = metrics;
    this.tracer = tracer;
    this.traceContext = traceContext;

    const providerKeysManager = new ProviderKeysManager(
      new ProviderKeysStore(this.supabaseClient),
      env
    );

    // Create SecureCacheProvider for distributed caching
    const cacheProvider = new SecureCacheProvider({
      SECURE_CACHE: env.SECURE_CACHE,
      REQUEST_CACHE_KEY: env.REQUEST_CACHE_KEY,
      REQUEST_CACHE_KEY_2: env.REQUEST_CACHE_KEY_2,
    });

    this.attemptBuilder = new AttemptBuilder(
      providerKeysManager,
      env,
      tracer,
      traceContext
    );
    this.attemptExecutor = new AttemptExecutor(env, ctx, cacheProvider, tracer);
  }

  async handle(): Promise<Response> {
    // Step 1: Parse and prepare request
    const bodyMapping: BodyMappingType =
      this.requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping;
    const parseSpan = this.traceContext?.sampled
      ? this.tracer.startSpan(
          "ai_gateway.gateway.parse_request",
          "parseAndPrepareRequest",
          "ai-gateway",
          {},
          this.traceContext
        )
      : null;
    const parseResult = await this.parseAndPrepareRequest();
    this.tracer.finishSpan(parseSpan);
    if (isErr(parseResult)) {
      return parseResult.error;
    }
    const {
      modelStrings,
      body: parsedBody,
      plugins,
      globalIgnoreProviders,
    } = parseResult.data;

    const requestParams: RequestParams = {
      isStreaming: parsedBody.stream === true,
      bodyMapping: bodyMapping,
    };

    let finalBody = parsedBody;
    // TODO: add prompt merging support for Responses API format
    if (this.hasPromptFields(parsedBody) && bodyMapping !== "NO_MAPPING") {
      if (bodyMapping === "RESPONSES") {
        return new Response(
          "Helicone Prompts is not supported for Responses API format on the AI Gateway",
          { status: 400 }
        );
      }
      this.metrics.markPromptRequestStart();
      const expandResult = await this.expandPrompt(parsedBody);
      if (isErr(expandResult)) {
        return expandResult.error;
      }
      this.metrics.markPromptRequestEnd();
      finalBody = expandResult.data.body;
    }

    const errors: Array<AttemptError> = [];

    // Step 3: Build all attempts
    const buildSpan = this.traceContext?.sampled
      ? this.tracer.startSpan(
          "ai_gateway.gateway.build_attempts",
          "attemptBuilder.buildAttempts",
          "ai-gateway",
          {},
          this.traceContext
        )
      : null;
    let attempts = await this.attemptBuilder.buildAttempts(
      modelStrings,
      this.orgId,
      bodyMapping,
      plugins,
      globalIgnoreProviders
    );
    this.tracer.finishSpan(buildSpan);

    // Filter out helicone provider attempts when x-stripe-customer-id is present
    // to ensure Stripe meter events are only sent for actual external provider usage
    if (this.requestWrapper.heliconeHeaders.stripeCustomerId) {
      attempts = attempts.filter(
        (attempt) => attempt.endpoint.provider !== "helicone"
      );
    }

    if (attempts.length === 0) {
      errors.push({
        source: "No available providers",
        type: "request_failed",
        message:
          "No available providers for the requested models. Check provider names and see supported models at https://helicone.ai/models",
        statusCode: 400,
      });
      return this.createErrorResponse(errors);
    }

    // Step 4: Get disallow list (only if there are PTB attempts)
    const hasPtbAttempts = attempts.some((a) => a.authType === "ptb");
    const disallowSpan = this.traceContext?.sampled && hasPtbAttempts
      ? this.tracer.startSpan(
          "ai_gateway.gateway.get_disallow_list",
          "getDisallowList",
          "ai-gateway",
          {},
          this.traceContext
        )
      : null;
    const disallowList = hasPtbAttempts
      ? await this.getDisallowList(this.orgId)
      : [];
    this.tracer.finishSpan(disallowSpan);

    // Step 5: Create forwarder function
    const forwarder = (
      targetBaseUrl: string | null,
      escrowInfo?: EscrowInfo
    ) => {
      return gatewayForwarder(
        {
          targetBaseUrl,
          setBaseURLOverride: (url) => {
            this.requestWrapper.setBaseURLOverride(url);
          },
          escrowInfo,
        },
        this.requestWrapper,
        this.env,
        this.ctx
      );
    };

    // Step 6: Try each attempt in order
    for (const attempt of attempts) {
      // temporarily disable Responses API calls for non-OpenAI endpoints
      if (
        bodyMapping === "RESPONSES" &&
        !ResponsesAPIEnabledProviders.includes(attempt.endpoint.provider)
      ) {
        errors.push({
          source: attempt.source,
          message: `The Responses API is only supported for the providers: ${ResponsesAPIEnabledProviders.join(", ")}`,
          type: "invalid_format",
          statusCode: 400,
        });
        continue;
      }
      if (
        attempt.authType === "ptb" &&
        (bodyMapping === "OPENAI" || bodyMapping === "RESPONSES")
      ) {
        let validationResult: Result<void, string>;
        if (bodyMapping === "RESPONSES") {
          validationResult = validateOpenAIResponsePayload(finalBody);
        } else {
          validationResult = validateOpenAIChatPayload(finalBody);
        }
        if (isErr(validationResult)) {
          errors.push({
            type: "invalid_format",
            statusCode: 400,
            message: validationResult.error,
          });
          continue;
        }
      }

      // Check disallow list (only for PTB attempts)
      if (attempt.authType === "ptb" && this.isDisallowed(attempt, disallowList)) {
        errors.push({
          source: attempt.source,
          message:
            "Cloud billing is disabled for this model and provider. Please contact support@helicone.ai for help",
          type: "disallowed",
          statusCode: 400,
        });
        continue;
      }
      // Set gateway attempt to request wrapper
      this.requestWrapper.setGatewayAttempt(attempt);

      const result = await this.attemptExecutor.execute({
        attempt,
        requestWrapper: this.requestWrapper,
        parsedBody: finalBody,
        requestParams,
        orgId: this.orgId,
        forwarder,
        metrics: this.metrics,
        orgMeta: this.orgMeta,
        traceContext: this.traceContext,
      });

      if (isErr(result)) {
        const attemptError = {
          ...result.error,
          source: attempt.source,
        } as AttemptError;
        // Bail early only for Helicone-generated 429s: escrow failure or rate limit
        const isHelicone429 =
          attemptError.statusCode === 429 &&
          (attemptError.type === "insufficient_credit_limit" ||
            attemptError.type === "rate_limited");
        if (isHelicone429 && errors.length === 0) {
          return this.createErrorResponse([attemptError]);
        }
        errors.push(attemptError);
        // Continue to next attempt otherwise (e.g., provider 429)
      } else {
        const mappedResponse = await this.mapResponse(
          attempt,
          result.data,
          bodyMapping
        );

        if (isErr(mappedResponse)) {
          console.error("Failed to map response:", mappedResponse.error);
          return result.data;
        }

        this.metrics.markPostRequestEnd();

        return mappedResponse.data;
      }
    }

    // All attempts failed
    this.metrics.markPostRequestEnd();
    return this.createErrorResponse(errors);
  }

  private async parseAndPrepareRequest(): Promise<
    Result<
      {
        modelStrings: string[];
        body: any;
        plugins?: Plugin[];
        globalIgnoreProviders?: Set<ModelProviderName>;
      },
      Response
    >
  > {
    // Get raw text body once
    // TODO: change to use safelyGetBody
    const rawBody = await this.requestWrapper.unsafeGetBodyText();
    const parsedBody: any = tryJSONParse(rawBody ?? "{}");

    if (!parsedBody || !parsedBody.model) {
      return err(
        new Response(
          "Invalid body or missing model. See supported models at https://helicone.ai/models",
          { status: 400 }
        )
      );
    }

    // Forces usage data for streaming requests
    if (
      parsedBody.stream === true &&
      this.requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping === "OPENAI"
    ) {
      parsedBody.stream_options = {
        ...(parsedBody.stream_options || {}),
        include_usage: true,
      };
    }

    // Parse comma-separated models for fallback
    // Validate that model is a string before splitting
    if (typeof parsedBody.model !== "string") {
      return err(
        new Response(
          "Invalid model type. Model must be a string. See supported models at https://helicone.ai/models",
          { status: 400 }
        )
      );
    }

    const plugins = parsedBody.plugins || [];

    const rawModelStrings = parsedBody.model
      .split(",")
      .map((m: string) => m.trim());

    const globalIgnoreProvidersSet = new Set<ModelProviderName>();
    const modelStrings: string[] = [];

    for (const modelString of rawModelStrings) {
      if (modelString.startsWith("!")) {
        // Global ignore provider
        const provider = modelString.slice(1);
        if (!provider) {
          return err(
            new Response(
              "Invalid global ignore syntax. Use !provider (e.g., !openai)",
              { status: 400 }
            )
          );
        }
        // Validate provider name
        if (!validateProvider(provider)) {
          return err(
            new Response(
              `Invalid provider in global ignore list: ${provider}. See supported providers at https://helicone.ai/models`,
              { status: 400 }
            )
          );
        }
        globalIgnoreProvidersSet.add(provider);
      } else {
        modelStrings.push(modelString);
      }
    }

    delete parsedBody.plugins;

    return ok({
      modelStrings,
      body: parsedBody,
      plugins,
      globalIgnoreProviders: globalIgnoreProvidersSet.size > 0 ? globalIgnoreProvidersSet : undefined,
    });
  }

  private hasPromptFields(body: any): boolean {
    return !!(
      body.prompt_id ||
      body.environment ||
      body.version_id ||
      body.inputs
    );
  }

  private async expandPrompt(
    parsedBody: any
  ): Promise<Result<{ body: any }, Response>> {
    const promptManager = new PromptManager(
      new HeliconePromptManager({
        apiKey: this.apiKey,
        baseUrl: this.env.VALHALLA_URL,
      }),
      new PromptStore(this.supabaseClient),
      this.env
    );

    const expandedResult = await promptManager.getMergedPromptBody(
      parsedBody,
      this.orgId
    );

    if (isErr(expandedResult)) {
      return err(
        new Response(JSON.stringify({ error: expandedResult.error }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    if (expandedResult.data.errors && expandedResult.data.errors.length > 0) {
      const errorMessage = expandedResult.data.errors
        .map(
          (error) =>
            `Variable '${error.variable}' is '${error.expected}' but got '${error.value}'`
        )
        .join("\n");

      return err(
        new Response(JSON.stringify({ error: errorMessage }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    // Update request wrapper with prompt settings
    this.requestWrapper.setPrompt2025Settings({
      promptId: parsedBody.prompt_id,
      promptVersionId: expandedResult.data.promptVersionId,
      inputs: parsedBody.inputs,
      environment: parsedBody.environment,
    });

    return ok({ body: expandedResult.data.body });
  }

  private async getDisallowList(orgId: string): Promise<DisallowListEntry[]> {
    try {
      const walletId = this.env.WALLET.idFromName(orgId);
      const walletStub = this.env.WALLET.get(walletId);
      return await walletStub.getDisallowList();
    } catch (error) {
      console.error("Failed to get disallow list:", error);
      return [];
    }
  }

  private isDisallowed(
    attempt: Attempt,
    disallowList: DisallowListEntry[]
  ): boolean {
    return disallowList.some(
      (entry) =>
        (entry.provider === attempt.endpoint.provider &&
          entry.model === attempt.endpoint.providerModelId) ||
        (entry.provider === attempt.endpoint.provider && entry.model === "*")
    );
  }

  private async mapResponse(
    attempt: Attempt,
    response: Response,
    bodyMapping?: BodyMappingType
  ): Promise<Result<Response, string>> {
    if (response.status >= 400) {
      return ok(response);
    }

    if (bodyMapping === "NO_MAPPING") {
      return ok(response); // do not map response
    }

    const mappingType = attempt.endpoint.modelConfig.responseFormat ?? "OPENAI";
    const contentType = response.headers.get("content-type");
    const isStream =
      contentType?.includes("text/event-stream") ||
      contentType?.includes("application/vnd.amazon.eventstream");

    try {
      if (mappingType === "OPENAI") {
        // If the request body mapping is Responses, convert Chat Completions
        // output to Responses API output for non-OpenAI providers.
        const provider = attempt.endpoint.provider;
        const providerModelId = attempt.endpoint.providerModelId;

        if (bodyMapping === "RESPONSES" && provider !== "openai") {
          if (isStream) {
            const mapped = oaiChat2responsesStreamResponse(response);
            return ok(mapped);
          } else {
            const mapped = await oaiChat2responsesResponse(response);
            return ok(mapped);
          }
        }

        // Otherwise, response is already in OpenAI format; normalize usage
        if (isStream) {
          const normalizedResponse = toOpenAIStreamResponse(
            response,
            provider,
            providerModelId,
            attempt.authType === "ptb"
          );
          return ok(normalizedResponse);
        } else {
          const normalizedResponse = await toOpenAIResponse(
            response,
            provider,
            providerModelId,
            isStream,
            attempt.authType === "ptb"
          );
          return ok(normalizedResponse);
        }
      } else if (mappingType === "ANTHROPIC") {
        // Convert OpenAI format to Anthropic format
        if (isStream) {
          const mappedResponse = ant2oaiStreamResponse(response);
          return ok(mappedResponse);
        } else {
          const mappedResponse = await ant2oaiResponse(response);
          return ok(mappedResponse);
        }
      }

      return ok(response);
    } catch (error) {
      console.error("Failed to map response:", error);
      return err(
        error instanceof Error ? error.message : "Failed to map response"
      );
    }
  }

  private async createErrorResponse(
    errors: Array<AttemptError>
  ): Promise<Response> {
    this.requestWrapper.setBaseURLOverride("https://ai-gateway.helicone.ai");

    // Determine the appropriate status code based on error types
    let statusCode = 500;
    let message = "All attempts failed";
    let code = "all_attempts_failed";

    // Priority order for status codes:
    // 1. If ANY error is 403 (wallet suspended, etc), return 403 with upstream message
    // 2. If ANY error is 401 (authentication), return 401
    // 3. If ANY non-429 error exists (BYOK provider errors), return it (normalized to 500)
    // 4. If first error is 400 (invalid_format), return 400
    // 5. If ALL errors are disallowed (400), return 400
    // 6. If ALL errors are 429 (insufficient credits), return 429
    // 7. Otherwise return 500

    const first403 = errors.find((e) => e.statusCode === 403);
    const has401 = errors.some((e) => e.statusCode === 401);
    const firstInvalid = errors.find(
      (e) => e.statusCode === 400 && e.type === "invalid_format"
    );
    const allDisallowed =
      errors.length > 0 && errors.every((e) => e.type === "disallowed");

    // Find any non-429 error (BYOK errors) that should be prioritized
    const firstNon429Error = errors.find(
      (e) =>
        e.statusCode !== 429 &&
        e.statusCode !== 403 &&
        e.statusCode !== 401 &&
        e.type !== "invalid_format" &&
        e.type !== "disallowed"
    );

    const all429 =
      errors.length > 0 && errors.every((e) => e.statusCode === 429);

    if (first403) {
      statusCode = 403;
      message = first403.message;
      code = "request_failed";
    } else if (has401) {
      statusCode = 401;
      message = "Authentication failed";
      code = "request_failed";
    } else if (firstNon429Error) {
      // Prefer BYOK provider errors over our own validation errors
      // This ensures users see what's wrong with their configured provider keys
      // Only preserve actionable authentication/access errors:
      // - 401 (Unauthorized): User needs to fix API key
      // - 403 (Forbidden): Access denied
      // All other provider errors normalize to 500 for consistency
      const isActionableAuthError =
        firstNon429Error.statusCode === 401 ||
        firstNon429Error.statusCode === 403;
      statusCode = isActionableAuthError ? firstNon429Error.statusCode : 500;
      message = firstNon429Error.message || "Request failed";
      code = "request_failed";
    } else if (firstInvalid) {
      statusCode = 400;
      message = firstInvalid.message;
      code = "request_failed";
    } else if (allDisallowed) {
      statusCode = 400;
      message =
        "Cloud billing is disabled for all requested models. Please contact support@helicone.ai for help";
      code = "request_failed";
    } else if (all429) {
      // Only return 429 if ALL attempts failed with 429
      statusCode = 429;
      const insufficient = errors.some(
        (e) => e.type === "insufficient_credit_limit"
      );
      if (insufficient) {
        message = "Insufficient credits";
        code = "request_failed";
      } else {
        message = "Rate limited";
        code = "rate_limited";
      }
    }

    const errorResponse = await errorForwarder(
      this.requestWrapper,
      this.env,
      this.ctx,
      {
        code,
        message,
        statusCode,
        details: errors,
      }
    );

    return errorResponse;
  }
}
