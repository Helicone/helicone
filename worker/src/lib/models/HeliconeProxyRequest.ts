// This will store all of the information coming from the client.

import { Env, Provider } from "../..";
import {
  TemplateWithInputs,
  parseJSXObject,
} from "../../api/lib/promptHelpers";
import { approvedDomains } from "../../packages/cost/providers/mappings";
import { RequestWrapper } from "../RequestWrapper";
import { buildTargetUrl } from "../clients/ProviderClient";
import { Result, ok } from "../util/results";
import { IHeliconeHeaders } from "./HeliconeHeaders";

import { CfProperties } from "@cloudflare/workers-types";
import { RateLimitOptions } from "../clients/KVRateLimiterClient";
import { RateLimitOptionsBuilder } from "../util/rateLimitOptions";

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
  tokenCalcUrl: Env["TOKEN_COUNT_URL"];
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
  cf?: CfProperties;
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
    private env: Env
  ) {
    this.tokenCalcUrl = env.VALHALLA_URL;
  }

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

    return {
      data: {
        heliconePromptTemplate: await this.getHeliconeTemplate(),
        rateLimitOptions: this.rateLimitOptions(),
        requestJson: await this.requestJson(),
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
        isStream: (await this.requestJson()).stream === true,
        bodyText: await this.getBody(),
        startTime,
        url: this.request.url,
        requestId:
          this.request.heliconeHeaders.requestId ?? crypto.randomUUID(),
        requestWrapper: this.request,
        nodeId: this.request.heliconeHeaders.nodeId ?? null,
        targetUrl,
        cf: this.request.cf ?? undefined,
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
