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
import { DisallowListEntry, EscrowInfo } from "./types";

export interface AuthContext {
  orgId: string;
  apiKey: string;
  supabaseClient: any;
}

export class SimpleAIGateway {
  private readonly attemptBuilder: AttemptBuilder;
  private readonly attemptExecutor: AttemptExecutor;
  private readonly orgId: string;
  private readonly apiKey: string;
  private readonly supabaseClient: any;

  constructor(
    private readonly requestWrapper: RequestWrapper,
    private readonly env: Env,
    private readonly ctx: ExecutionContext,
    authContext: AuthContext
  ) {
    this.orgId = authContext.orgId;
    this.apiKey = authContext.apiKey;
    this.supabaseClient = authContext.supabaseClient;

    const providerKeysManager = new ProviderKeysManager(
      new ProviderKeysStore(this.supabaseClient),
      env
    );

    this.attemptBuilder = new AttemptBuilder(providerKeysManager, env);
    this.attemptExecutor = new AttemptExecutor(env, ctx);
  }

  async handle(): Promise<Response> {
    // Step 1: Parse and prepare request
    const parseResult = await this.parseAndPrepareRequest();
    if (isErr(parseResult)) {
      return parseResult.error;
    }
    const { modelStrings, body: parsedBody } = parseResult.data;

    // Step 2: Handle prompt expansion if needed
    let finalBody = parsedBody;
    if (this.hasPromptFields(parsedBody)) {
      const expandResult = await this.expandPrompt(parsedBody);
      if (isErr(expandResult)) {
        return expandResult.error;
      }
      finalBody = expandResult.data.body;
    }

    // Step 3: Build all attempts
    const attempts = await this.attemptBuilder.buildAttempts(
      modelStrings,
      this.orgId,
      this.requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping
    );
    if (attempts.length === 0) {
      return new Response(
        "No available providers for the requested models. Check provider names and see supported models at https://helicone.ai/models",
        { status: 400 }
      );
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
    // TODO: Use Error type in types.ts
    const errors: Array<{
      attempt: string;
      error: string;
      type?: string;
      statusCode?: number;
    }> = [];

    for (const attempt of attempts) {
      // Check disallow list
      if (this.isDisallowed(attempt, disallowList)) {
        errors.push({
          attempt: attempt.source,
          error:
            "Cloud billing is disabled for this model and provider. Please contact support@helicone.ai for help",
          type: "disallowed",
          statusCode: 400,
        });
        continue;
      }

      const result = await this.attemptExecutor.execute(
        attempt,
        this.requestWrapper,
        finalBody,
        this.orgId,
        forwarder
      );

      if (isErr(result)) {
        errors.push({
          attempt: attempt.source,
          error: result.error.message,
          type: result.error.type,
          statusCode: result.error.statusCode,
        });
        // Continue to next attempt
      } else {
        // Success!
        this.requestWrapper.setSuccessfulAttempt(attempt);
        return result.data;
      }
    }

    // All attempts failed
    return this.createErrorResponse(errors);
  }

  private async parseAndPrepareRequest(): Promise<
    Result<{ modelStrings: string[]; body: any }, Response>
  > {
    // Get raw text body once
    const rawBody = await this.requestWrapper.getText();
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

    const modelStrings = parsedBody.model
      .split(",")
      .map((m: string) => m.trim());

    return ok({ modelStrings, body: parsedBody });
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
    attempt: any,
    disallowList: DisallowListEntry[]
  ): boolean {
    return disallowList.some(
      (entry) =>
        (entry.provider === attempt.endpoint.provider &&
          entry.model === attempt.endpoint.providerModelId) ||
        (entry.provider === attempt.endpoint.provider && entry.model === "*")
    );
  }

  private async createErrorResponse(
    errors: Array<{
      attempt: string;
      error: string;
      type?: string;
      statusCode?: number;
    }>
  ): Promise<Response> {
    this.requestWrapper.setBaseURLOverride("https://ai-gateway.helicone.ai");

    // Determine the appropriate status code based on error types
    let statusCode = 500;
    let message = "All attempts failed";
    let code = "all_attempts_failed";

    // Priority order for status codes:
    // 1. If ANY error is 429 (insufficient credits), return 429
    // 2. If ANY error is 401 (authentication), return 401
    // 3. If ALL errors are disallowed (400), return 400
    // 4. Otherwise return 500

    const has429 = errors.some((e) => e.statusCode === 429);
    const has401 = errors.some((e) => e.statusCode === 401);
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
        details: JSON.stringify(errors),
      }
    );

    return errorResponse;
  }
}
