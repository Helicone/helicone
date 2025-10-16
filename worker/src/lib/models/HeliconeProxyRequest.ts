// This will store all of the information coming from the client.

import { Provider } from "@helicone-package/llm-mapper/types";
import { approvedDomains } from "@helicone-package/cost/providers/mappings";
import { RequestWrapper } from "../RequestWrapper";
import { buildTargetUrl } from "../clients/ProviderClient";
import { Result, ok } from "../util/results";
import {
  HeliconeTokenLimitExceptionHandler,
  IHeliconeHeaders,
} from "./HeliconeHeaders";

import { parseJSXObject } from "@helicone/prompts";
import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { MAPPERS } from "@helicone-package/llm-mapper/utils/getMappedContent";
import { getMapperType } from "@helicone-package/llm-mapper/utils/getMapperType";
import { RateLimitOptions } from "../clients/DurableObjectRateLimiterClient";
import { RateLimitOptionsBuilder } from "../util/rateLimitOptions";
import { EscrowInfo } from "../ai-gateway/types";
import { ValidRequestBody } from "../../RequestBodyBuffer/IRequestBodyBuffer";

export type RetryOptions = {
  retries: number; // number of times to retry the request
  factor: number; // exponential backoff factor
  minTimeout: number; // minimum amount of time to wait before retrying (in milliseconds)
  maxTimeout: number; // maximum amount of time to wait before retrying (in milliseconds)
};

export type HeliconeProperties = Record<string, string>;
type Nullable<T> = T | null;

import {
  applyFallbackStrategy,
  applyMiddleOutStrategy,
  applyTruncateStrategy,
  estimateTokenCount,
  getModelTokenLimit,
  parseRequestPayload,
  resolvePrimaryModel,
} from "../util/tokenLimitException";

// This neatly formats and holds all of the state that a request can come into Helicone
export interface HeliconeProxyRequest {
  provider: Provider;
  tokenCalcUrl: Env["TOKEN_COUNT_URL"];
  rateLimitOptions: Nullable<RateLimitOptions>;
  isRateLimitedKey: boolean;
  retryOptions: IHeliconeHeaders["retryHeaders"];
  omitOptions: IHeliconeHeaders["omitHeaders"];

  body: ValidRequestBody;
  unsafeGetBodyText: () => Promise<string | null>;

  heliconeErrors: string[];
  providerAuthHash?: string;
  heliconeProxyKeyId?: string;
  api_base: string;
  heliconeProperties: HeliconeProperties;
  userId?: string;
  isStream: boolean;
  startTime: Date;
  url: URL;
  requestWrapper: RequestWrapper;
  requestId: string;
  nodeId: string | null;
  heliconePromptTemplate: TemplateWithInputs | null;
  targetUrl: URL;
  threat?: boolean;
  flaggedForModeration?: boolean;
  cf?: CfProperties;
  escrowInfo?: EscrowInfo;
}

const providerBaseUrlMappings: Record<
  "OPENAI" | "ANTHROPIC" | "CUSTOM",
  string
> = {
  OPENAI: "https://api.openai.com",
  ANTHROPIC: "https://api.anthropic.com",
  CUSTOM: "",
};

// Helps map a RequestWrapper -> HeliconProxyRequest
export class HeliconeProxyRequestMapper {
  private tokenCalcUrl: string;
  heliconeErrors: string[] = [];

  constructor(
    private request: RequestWrapper,
    private provider: Provider,
    private env: Env,
    private escrowInfo?: EscrowInfo
  ) {
    this.tokenCalcUrl = env.VALHALLA_URL;
  }

  private async getHeliconeTemplate() {
    if (this.request.heliconeHeaders.promptHeaders.promptId) {
      try {
        const rawJson = JSON.parse(
          await this.request.requestBodyBuffer.unsafeGetRawText()
        );

        // Get the mapper type based on the request
        const mapperType = getMapperType({
          model: rawJson.model,
          provider: this.provider,
          path: this.request.url.pathname,
          requestReferrer: this.request.requestReferrer,
        });

        // Map the request using the appropriate mapper
        const mapper = MAPPERS[mapperType];
        if (!mapper) {
          console.error(`No mapper found for type ${mapperType}`);
          return null;
        }

        const mappedResult = mapper({
          request: rawJson,
          response: { choices: [] },
          statusCode: 200,
          model: rawJson.model,
        });

        // parseJSX only on the messages to avoid tools from being touched
        const parsedJSXMessages = parseJSXObject(
          JSON.parse(JSON.stringify(mappedResult.schema.request.messages))
        );

        const templateWithInputs = {
          inputs:
            this.request.promptSettings.promptInputs ??
            parsedJSXMessages.templateWithInputs.inputs,
          autoInputs: parsedJSXMessages.templateWithInputs.autoInputs,
          template: {
            ...mappedResult.schema.request,
            messages: parsedJSXMessages.templateWithInputs.template,
          },
        };
        return templateWithInputs;
      } catch (error) {
        console.error("Error in getHeliconeTemplate:", error);
        return null;
      }
    }
    return null;
  }
  async tryToProxyRequest(): Promise<Result<HeliconeProxyRequest, string>> {
    const startTime = new Date();
    const { data: api_base, error: api_base_error } = this.getApiBase();
    if (api_base_error !== null) {
      return { data: null, error: api_base_error };
    }

    const targetUrl = buildTargetUrl(this.request.url, api_base);

    let isStream = await this.request.requestBodyBuffer.isStream();

    if (this.provider === "GOOGLE") {
      const queryParams = new URLSearchParams(targetUrl.search);
      // alt = sse is how Gemini determines if a request is a stream
      isStream = isStream || queryParams.get("alt") === "sse";
    }

    if (this.provider === "AWS" || this.provider === "BEDROCK") {
      isStream =
        isStream || targetUrl.pathname.includes("invoke-with-response-stream");
    }

    let body: ValidRequestBody;
    try {
      body = await this.request.safelyGetBody();
    } catch (e) {
      body = await this.request.unsafeGetBodyText();
    }

    // Apply token limit exception handler here and update buffer if changed
    const bodyWithTokenLimitExceptionHandler =
      this.applyTokenLimitExceptionHandler(body);
    if (typeof bodyWithTokenLimitExceptionHandler === "string") {
      body = bodyWithTokenLimitExceptionHandler;
      await this.request.requestBodyBuffer.tempSetBody(
        bodyWithTokenLimitExceptionHandler
      );
    }

    return {
      data: {
        heliconePromptTemplate: await this.getHeliconeTemplate(),
        rateLimitOptions: this.rateLimitOptions(),
        isRateLimitedKey:
          this.request.heliconeHeaders.heliconeAuthV2?.keyType ===
          "rate-limited",
        retryOptions: this.request.heliconeHeaders.retryHeaders,
        provider: this.provider,
        tokenCalcUrl: this.tokenCalcUrl,
        providerAuthHash: await this.request.getProviderAuthHeader(),
        omitOptions: this.request.heliconeHeaders.omitHeaders,
        heliconeProxyKeyId: this.request.heliconeProxyKeyId,
        heliconeProperties: this.request.heliconeHeaders.heliconeProperties,
        userId: await this.request.getUserId(),
        heliconeErrors: this.heliconeErrors,
        api_base,
        isStream: isStream,
        body: body,
        unsafeGetBodyText: this.request.unsafeGetBodyText.bind(this.request),

        startTime,
        url: this.request.url,
        requestId:
          this.request.heliconeHeaders.requestId ?? crypto.randomUUID(),
        requestWrapper: this.request,
        nodeId: this.request.heliconeHeaders.nodeId ?? null,
        targetUrl,
        cf: this.request.cf ?? undefined,
        escrowInfo: this.escrowInfo,
      },
      error: null,
    };
  }

  public applyTokenLimitExceptionHandler(
    body: ValidRequestBody
  ): ValidRequestBody | undefined {
    const handler = this.request.heliconeHeaders.tokenLimitExceptionHandler;
    if (!handler) {
      return;
    }

    const parsedBody = parseRequestPayload(body);
    if (!parsedBody) {
      return;
    }

    const primaryModel = resolvePrimaryModel(
      parsedBody,
      this.request.heliconeHeaders.modelOverride
    );
    const estimatedTokens = estimateTokenCount(parsedBody, primaryModel);

    if (!primaryModel) {
      return;
    }

    const modelContextLimit = getModelTokenLimit(this.provider, primaryModel);

    // Extract requested completion/output limit directly here (provider-agnostic best-effort)
    const anyBody = parsedBody as any;
    const completionCandidates: Array<unknown> = [
      anyBody?.max_completion_tokens,
      anyBody?.max_tokens,
      anyBody?.max_output_tokens,
      anyBody?.maxOutputTokens,
      anyBody?.response?.max_tokens,
      anyBody?.response?.max_output_tokens,
      anyBody?.response?.maxOutputTokens,
      anyBody?.generation_config?.max_output_tokens,
      anyBody?.generation_config?.maxOutputTokens,
      anyBody?.generationConfig?.max_output_tokens,
      anyBody?.generationConfig?.maxOutputTokens,
    ];
    const requestedCompletionTokens = (() => {
      for (const val of completionCandidates) {
        if (typeof val === "number" && Number.isFinite(val) && val > 0) {
          return Math.floor(val);
        }
      }
      return 0;
    })();
    const tokenLimit =
      modelContextLimit === null
        ? null
        : Math.max(
            0,
            modelContextLimit -
              (requestedCompletionTokens || modelContextLimit * 0.1)
          );

    if (
      estimatedTokens === null ||
      tokenLimit === null ||
      (estimatedTokens <= tokenLimit &&
        handler != HeliconeTokenLimitExceptionHandler.Fallback) //needed to sort the extra model passed in request
    ) {
      return;
    }

    // TODO: Add some indicator as to what was applied so users understand why their request looks different
    switch (handler) {
      case HeliconeTokenLimitExceptionHandler.Truncate:
        return applyTruncateStrategy(parsedBody);
      case HeliconeTokenLimitExceptionHandler.MiddleOut:
        return applyMiddleOutStrategy(parsedBody, primaryModel, tokenLimit);
      case HeliconeTokenLimitExceptionHandler.Fallback:
        return applyFallbackStrategy(
          parsedBody,
          primaryModel,
          estimatedTokens,
          tokenLimit
        );
      default:
        return;
    }
  }

  private validateApiConfiguration(api_base: string | undefined): boolean {
    return (
      api_base === undefined ||
      approvedDomains.some((domain) => domain.test(api_base))
    );
  }

  private getApiBase(): Result<string, string> {
    if (this.request.baseURLOverride) {
      return ok(this.request.baseURLOverride);
    }
    const api_base =
      this.request.heliconeHeaders.openaiBaseUrl ??
      this.request.heliconeHeaders.targetBaseUrl;

    if (api_base && !this.validateApiConfiguration(api_base)) {
      // return new Response(`Invalid API base "${api_base}"`, {
      return {
        data: null,
        error: `Invalid API base "${api_base}"`,
      };
    }

    // this is kind of legacy stuff. the correct way to add providers is to add it to `modifyEnvBasedOnPath` (04/28/2024)
    if (api_base) {
      return { data: api_base, error: null };
    } else if (
      this.provider === "CUSTOM" ||
      this.provider === "ANTHROPIC" ||
      this.provider === "OPENAI"
    ) {
      return {
        data: providerBaseUrlMappings[this.provider],
        error: null,
      };
    } else {
      return {
        data: null,
        error: `Invalid provider "${this.provider}"`,
      };
    }
  }

  rateLimitOptions(): HeliconeProxyRequest["rateLimitOptions"] {
    const rateLimitOptions = new RateLimitOptionsBuilder(
      this.request.heliconeHeaders.rateLimitPolicy
    ).build();

    if (rateLimitOptions.error) {
      rateLimitOptions.error = `Invalid rate limit policy: ${rateLimitOptions.error}`;
      this.heliconeErrors.push(rateLimitOptions.error);
    }
    return rateLimitOptions.data ?? null;
  }
}
