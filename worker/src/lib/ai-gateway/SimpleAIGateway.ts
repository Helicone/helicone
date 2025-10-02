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
import { oai2antResponse } from "../clients/llmmapper/router/oai2ant/nonStream";
import { oai2antStreamResponse } from "../clients/llmmapper/router/oai2ant/stream";
import { RequestParams } from "@helicone-package/cost/models/types";
import { SecureCacheProvider } from "../util/cache/secureCache";
import { GatewayMetrics } from "./GatewayMetrics";

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

  constructor(
    private readonly requestWrapper: RequestWrapper,
    private readonly env: Env,
    private readonly ctx: ExecutionContext,
    authContext: AuthContext,
    metrics: GatewayMetrics
  ) {
    this.orgId = authContext.orgId;
    this.apiKey = authContext.apiKey;
    this.supabaseClient = authContext.supabaseClient;
    this.orgMeta = authContext.orgMeta;
    this.metrics = metrics;

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

    this.attemptBuilder = new AttemptBuilder(providerKeysManager, env);
    this.attemptExecutor = new AttemptExecutor(env, ctx, cacheProvider);
  }

  async handle(): Promise<Response> {
    // Step 1: Parse and prepare request
    const parseResult = await this.parseAndPrepareRequest();
    if (isErr(parseResult)) {
      return parseResult.error;
    }
    const { modelStrings, body: parsedBody, plugins } = parseResult.data;

    const requestParams: RequestParams = {
      isStreaming: parsedBody.stream === true,
    };

    let finalBody = parsedBody;
    if (this.hasPromptFields(parsedBody)) {
      const expandResult = await this.expandPrompt(parsedBody);
      if (isErr(expandResult)) {
        return expandResult.error;
      }
      finalBody = expandResult.data.body;
    }

    const errors: Array<AttemptError> = [];

    // Step 3: Build all attempts
    const attempts = await this.attemptBuilder.buildAttempts(
      modelStrings,
      this.orgId,
      this.requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
      plugins
    );
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

    // Step 4: Get disallow list
    const disallowList = await this.getDisallowList(this.orgId);

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
      // Check disallow list
      if (this.isDisallowed(attempt, disallowList)) {
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
      });

      if (isErr(result)) {
        errors.push({
          ...result.error,
          source: attempt.source,
        });
        // Continue to next attempt
      } else {
        const mappedResponse = await this.mapResponse(
          attempt,
          result.data,
          this.requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping
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
    return this.createErrorResponse(errors);
  }

  private async parseAndPrepareRequest(): Promise<
    Result<{ modelStrings: string[]; body: any; plugins?: Plugin[] }, Response>
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

    let plugins = parsedBody.plugins || [];

    const modelStrings = parsedBody.model
      .split(",")
      .map((m: string) => m.trim());

    delete parsedBody.plugins;

    return ok({ modelStrings, body: parsedBody, plugins });
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
    bodyMapping?: "OPENAI" | "NO_MAPPING"
  ): Promise<Result<Response, string>> {
    if (bodyMapping === "NO_MAPPING") {
      return ok(response); // do not map response
    }

    const mappingType = attempt.endpoint.modelConfig.responseFormat ?? "OPENAI";
    if (mappingType === "OPENAI") {
      return ok(response); // already in OPENAI format
    }

    try {
      if (mappingType === "ANTHROPIC") {
        const contentType = response.headers.get("content-type");
        const isStream = contentType?.includes("text/event-stream");

        if (isStream) {
          const mappedResponse = oai2antStreamResponse(response);
          return ok(mappedResponse);
        } else {
          const mappedResponse = await oai2antResponse(response);
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
    // 1. If ANY error is 429 (insufficient credits), return 429
    // 2. If ANY error is 401 (authentication), return 401
    // 3. If ANY error is 403 (wallet suspended, etc), return 403 with upstream message
    // 4. If ALL errors are disallowed (400), return 400
    // 5. Otherwise return 500

    const has429 = errors.some((e) => e.statusCode === 429);
    const has401 = errors.some((e) => e.statusCode === 401);
    const first403 = errors.find((e) => e.statusCode === 403);
    const allDisallowed =
      errors.length > 0 && errors.every((e) => e.type === "disallowed");

    if (has429) {
      statusCode = 429;
      message = "Insufficient credits";
      code = "request_failed";
    } else if (has401) {
      statusCode = 401;
      message = "Authentication failed";
      code = "request_failed";
    } else if (first403) {
      statusCode = 403;
      message = first403.message;
      code = "request_failed";
    } else if (allDisallowed) {
      statusCode = 400;
      message =
        "Cloud billing is disabled for all requested models. Please contact support@helicone.ai for help";
      code = "request_failed";
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
