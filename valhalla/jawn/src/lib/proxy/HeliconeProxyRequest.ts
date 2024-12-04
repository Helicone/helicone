import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { IHeliconeHeaders } from "../../../../../shared/proxy/heliconeHeaders";
import { Provider } from "../../models/models";
import { approvedDomains } from "../../packages/cost/providers/mappings";

import { RequestWrapper } from "../requestWrapper/requestWrapper";
import { Result, ok } from "../shared/result";
import { buildTargetUrl } from "./ProviderClient";
import { RateLimitOptionsBuilder } from "./RateLimitOptions";
import { RateLimitOptions } from "./RateLimiter";
import { parseJSXObject } from "@helicone/prompts";

export type RetryOptions = {
  retries: number; // number of times to retry the request
  factor: number; // exponential backoff factor
  minTimeout: number; // minimum amount of time to wait before retrying (in milliseconds)
  maxTimeout: number; // maximum amount of time to wait before retrying (in milliseconds)
};

export type HeliconeProperties = Record<string, string>;
type Nullable<T> = T | null;

// This neatly formats and holds all of the state that a request can come into Helicone
export interface HeliconeProxyRequest {
  provider: Provider;
  tokenCalcUrl: string;
  rateLimitOptions: Nullable<RateLimitOptions>;
  retryOptions: IHeliconeHeaders["retryHeaders"];
  omitOptions: IHeliconeHeaders["omitHeaders"];

  requestJson: { stream?: boolean; user?: string } | Record<string, never>;
  bodyText: string | null;

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
  experimentColumnId: string | null;
  experimentRowIndex: string | null;
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
  heliconeErrors: string[] = [];

  constructor(private request: RequestWrapper, private provider: Provider) {}

  private async getHeliconeTemplate() {
    if (this.request.heliconeHeaders.promptHeaders.promptId) {
      const { templateWithInputs } = parseJSXObject(
        JSON.parse(await this.request.getRawText())
      );
      return templateWithInputs;
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

    const requestJson = await this.requestJson();
    let isStream = requestJson.stream === true;

    if (this.provider === "GOOGLE") {
      const queryParams = new URLSearchParams(targetUrl.search);
      // alt = sse is how Gemini determines if a request is a stream
      isStream = isStream || queryParams.get("alt") === "sse";
    }

    return {
      data: {
        heliconePromptTemplate: await this.getHeliconeTemplate(),
        rateLimitOptions: this.rateLimitOptions(),
        requestJson: requestJson,
        retryOptions: this.request.heliconeHeaders.retryHeaders,
        provider: this.provider,
        tokenCalcUrl: "",
        providerAuthHash: await this.request.getProviderAuthHeader(),
        omitOptions: this.request.heliconeHeaders.omitHeaders,
        heliconeProxyKeyId: this.request.heliconeProxyKeyId,
        heliconeProperties: this.request.heliconeHeaders.heliconeProperties,
        userId: await this.request.getUserId(),
        heliconeErrors: this.heliconeErrors,
        api_base,
        isStream: isStream,
        bodyText: await this.getBody(),
        startTime,
        url: this.request.url,
        requestId:
          this.request.heliconeHeaders.requestId ?? crypto.randomUUID(),
        requestWrapper: this.request,
        nodeId: this.request.heliconeHeaders.nodeId ?? null,
        targetUrl,
        experimentColumnId:
          this.request.heliconeHeaders.experimentColumnId ?? null,
        experimentRowIndex:
          this.request.heliconeHeaders.experimentRowIndex ?? null,
      },
      error: null,
    };
  }

  private async getBody(): Promise<string | null> {
    if (this.request.getMethod() === "GET") {
      return null;
    }

    return await this.request.getText();
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

  async requestJson(): Promise<HeliconeProxyRequest["requestJson"]> {
    return this.request.getMethod() === "POST"
      ? await this.request.getJson()
      : {};
  }
}
