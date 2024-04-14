// This will store all of the information coming from the client.

import { Env, Provider } from "../..";
import {
  TemplateWithInputs,
  parseJSXObject,
} from "../../api/lib/promptHelpers";
import { approvedDomains } from "../../packages/cost/providers/mappings";
import { Result, ok } from "../util/results";
import { IHeliconeHeaders } from "./HeliconeHeaders";
import { RequestWrapper } from "../RequestWrapper";
import { buildTargetUrl } from "../clients/ProviderClient";

import {
  RateLimitOptions,
  RateLimitOptionsBuilder,
} from "../util/rateLimitOptions";
import { CfProperties } from "@cloudflare/workers-types";

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

const providerBaseUrlMappings: Record<Provider, string> = {
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

  async tryToProxyRequest(): Promise<Result<HeliconeProxyRequest, string>> {
    const startTime = new Date();
    const { data: api_base, error: api_base_error } = this.getApiBase();
    if (api_base_error !== null) {
      return { data: null, error: api_base_error };
    }

    let heliconePromptTemplate: TemplateWithInputs | null = null;
    if (this.request.heliconeHeaders.promptId) {
      const { templateWithInputs } = parseJSXObject(
        JSON.parse(await this.request.getRawText())
      );
      heliconePromptTemplate = templateWithInputs;

      this.injectPromptInputs(templateWithInputs.inputs);
    }

    const targetUrl = buildTargetUrl(this.request.url, api_base);

    return {
      data: {
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
        heliconePromptTemplate,
        targetUrl,
        cf: this.request.cf ?? undefined,
      },
      error: null,
    };
  }

  private injectPromptInputs(inputs: Record<string, string>) {
    Object.entries(inputs).forEach(([key, value]) => {
      this.request.heliconeHeaders.heliconeProperties[
        `Helicone-Prompt-Input-${key}`
      ] = value;
    });
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

    if (api_base) {
      return { data: api_base, error: null };
    } else {
      return {
        data: providerBaseUrlMappings[this.provider],
        error: null,
      };
    }
  }

  rateLimitOptions(): HeliconeProxyRequest["rateLimitOptions"] {
    const rateLimitOptions = new RateLimitOptionsBuilder(
      this.request.heliconeHeaders.rateLimitPolicy
    ).build();

    if (rateLimitOptions.error) {
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
