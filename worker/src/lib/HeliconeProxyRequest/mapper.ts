// This will store all of the information coming from the client.

import { Env, Provider } from "../..";
import { Result } from "../../results";
import { IHeliconeHeaders } from "../HeliconeHeaders";
import { RequestWrapper } from "../RequestWrapper";
import {
  ChatPrompt,
  FormattedPrompt,
  Prompt,
  extractPrompt,
} from "../promptFormater/prompt";
import { RateLimitOptions, RateLimitOptionsBuilder } from "./rateLimit";

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
  heliconeAuthHash?: string;
  heliconeProxyKeyId?: string;
  api_base: string;
  heliconeProperties: HeliconeProperties;
  userId?: string;
  isStream: boolean;
  formattedPrompt: Nullable<{
    prompt: Prompt | ChatPrompt;
    name: string;
  }>;
  startTime: Date;
  url: URL;
  requestWrapper: RequestWrapper;
  requestId: string;
  nodeId: string | null;
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
    this.tokenCalcUrl = env["TOKEN_COUNT_URL"];
  }
  // WARNING
  // This function is really weird and mutates the request object.
  // Please be careful when using this function.
  // It is used in the following places:
  //  - At the beginning when this class is instantiated
  private async runPromptFormatter(): Promise<
    Result<FormattedPrompt | null, string>
  > {
    if (this.isPromptFormatterEnabled()) {
      console.log("Running prompt formatter");
      const text = await this.request.getText();
      const promptFormatter = extractPrompt(JSON.parse(text));

      if (promptFormatter.error !== null) {
        this.heliconeErrors.push(promptFormatter.error);
        return {
          data: null,
          error: promptFormatter.error,
        };
      }
      const body = promptFormatter.data.body;

      const requestWrapper = await RequestWrapper.create(
        new Request(this.request.url.href, {
          method: this.request.getMethod(),
          headers: this.request.getHeaders(),
          body,
        }),
        this.env
      );

      if (requestWrapper.error || !requestWrapper.data) {
        return {
          data: null,
          error: requestWrapper.error ?? "RequestWrapper is null",
        };
      }

      this.request = requestWrapper.data;

      this.request.setHeader("Content-Length", `${body.length}`);
      return { data: promptFormatter.data, error: null };
    }
    return { data: null, error: null };
  }

  async tryToProxyRequest(): Promise<Result<HeliconeProxyRequest, string>> {
    const startTime = new Date();

    const { error: promptFormatterError, data: promptFormatter } =
      await this.runPromptFormatter();
    if (promptFormatterError !== null) {
      return { data: null, error: promptFormatterError };
    }

    const { data: api_base, error: api_base_error } = this.getOpenAiApiBase();
    if (api_base_error !== null) {
      return { data: null, error: api_base_error };
    }
    const { data: heliconeAuthHash, error: heliconeAuthHashError } =
      await this.request.getHeliconeAuthHeader();
    if (heliconeAuthHashError !== null) {
      return { data: null, error: heliconeAuthHashError };
    }

    return {
      data: {
        rateLimitOptions: this.rateLimitOptions(),
        requestJson: await this.requestJson(),
        retryOptions: this.request.heliconeHeaders.retryHeaders,
        provider: this.provider,
        tokenCalcUrl: this.tokenCalcUrl,
        providerAuthHash: await this.request.getProviderAuthHeader(),
        omitOptions: this.request.heliconeHeaders.omitHeaders,
        heliconeAuthHash: heliconeAuthHash ?? undefined,
        heliconeProxyKeyId: this.request.heliconeProxyKeyId,
        heliconeProperties: this.request.heliconeHeaders.heliconeProperties,
        userId: await this.request.getUserId(),
        heliconeErrors: this.heliconeErrors,
        api_base,
        isStream: (await this.requestJson()).stream === true,
        bodyText: await this.getBody(),
        startTime,
        url: this.request.url,
        formattedPrompt: promptFormatter
          ? {
              name: this.request.heliconeHeaders.promptName ?? "",
              prompt: promptFormatter.prompt,
            }
          : null,
        requestId:
          this.request.heliconeHeaders.requestId ?? crypto.randomUUID(),
        requestWrapper: this.request,
        nodeId: this.request.heliconeHeaders.nodeId ?? null,
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

  private isPromptFormatterEnabled(): boolean {
    return (
      this.request.heliconeHeaders.promptFormat !== undefined &&
      this.request.heliconeHeaders.promptFormat !== null
    );
  }

  private validateApiConfiguration(api_base: string | undefined): boolean {
    const openAiPattern = /^https:\/\/api\.openai\.com\/v\d+\/?$/;
    const anthropicPattern = /^https:\/\/api\.anthropic\.com\/v\d+\/?$/;
    const azurePattern =
      /^(https?:\/\/)?([^.]*\.)?(openai\.azure\.com|azure-api\.net)(\/.*)?$/;
    const localProxyPattern = /^http:\/\/127\.0\.0\.1:\d+\/v\d+\/?$/;
    const heliconeProxyPattern = /^https:\/\/oai\.hconeai\.com\/v\d+\/?$/;
    const amdbartekPattern = /^https:\/\/.*\.amdbartek\.dev\/v\d+\/?$/;
    const anyscalePattern =
      /^https:\/\/api\.endpoints\.anyscale\.com\/v\d+\/?$/;

    return (
      api_base === undefined ||
      openAiPattern.test(api_base) ||
      anthropicPattern.test(api_base) ||
      azurePattern.test(api_base) ||
      localProxyPattern.test(api_base) ||
      heliconeProxyPattern.test(api_base) ||
      amdbartekPattern.test(api_base) ||
      anyscalePattern.test(api_base)
    );
  }

  private getOpenAiApiBase(): Result<string, string> {
    const api_base = this.request.heliconeHeaders.openaiBaseUrl;
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
