// This will store all of the information coming from the client.

import { hash } from "../..";
import { GenericResult, Result } from "../../results";
import { HeliconeHeaders, RequestWrapper } from "../RequestWrapper";
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

export type Provider = "OPENAI" | "ANTHROPIC";
export type HeliconeProperties = Record<string, string>;
type Nullable<T> = T | null;

// This neatly formats and holds all of the state that a request can come into Helicone
export interface HeliconeProxyRequest {
  provider: Provider;
  rateLimitOptions: Nullable<RateLimitOptions>;
  retryOptions: HeliconeHeaders["retryHeaders"];

  requestJson: { stream?: boolean; user?: string } | Record<string, never>;
  bodyText: string | null;

  heliconeErrors: string[];
  providerAuthHash?: string;
  heliconeAuthHash?: string;
  api_base: Nullable<string>;
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
}

// Helps map a RequestWrapper -> HeliconProxyRequest
export class HeliconeProxyRequestMapper {
  heliconeErrors: string[] = [];

  constructor(private request: RequestWrapper) {}
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

      this.request = new RequestWrapper(
        new Request(this.request.url.href, {
          method: this.request.getMethod(),
          headers: this.request.getHeaders(),
          body,
        })
      );

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
      await this.getHeliconeAuthHeader();
    if (heliconeAuthHashError !== null) {
      return { data: null, error: heliconeAuthHashError };
    }

    return {
      data: {
        rateLimitOptions: this.rateLimitOptions(),
        requestJson: await this.requestJson(),
        retryOptions: this.request.heliconeHeaders.retryHeaders,
        provider: "OPENAI",

        providerAuthHash: this.request.authorization
          ? await hash(this.request.authorization)
          : undefined,
        heliconeAuthHash: heliconeAuthHash ?? undefined,
        heliconeProperties: this.request.heliconeProperties,
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
      },
      error: null,
    };
  }

  private async getHeliconeAuthHeader(): Promise<
    Result<string | null, string>
  > {
    const heliconeAuth = this.request.heliconeHeaders.heliconeAuth;
    if (!heliconeAuth) {
      return { data: null, error: null };
    }
    if (!heliconeAuth.includes("Bearer ")) {
      return { data: null, error: "Must included Bearer in API Key" };
    }

    const apiKey = heliconeAuth.replace("Bearer ", "").trim();
    const apiKeyPattern =
      /^sk-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/;

    if (!apiKeyPattern.test(apiKey)) {
      return {
        data: null,
        error: "API Key is not well formed",
      };
    }
    const apiKeyHash = await hash(`Bearer ${apiKey}`);
    return { data: apiKeyHash, error: null };
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
    const azurePattern =
      /^https:\/\/([^.]*\.azure-api\.net|[^.]*\.openai\.azure\.com)\/?$/;
    const localProxyPattern = /^http:\/\/127\.0\.0\.1:\d+\/v\d+\/?$/;
    const heliconeProxyPattern = /^https:\/\/oai\.hconeai\.com\/v\d+\/?$/;

    return (
      api_base === undefined ||
      openAiPattern.test(api_base) ||
      azurePattern.test(api_base) ||
      localProxyPattern.test(api_base) ||
      heliconeProxyPattern.test(api_base)
    );
  }

  private getOpenAiApiBase(): Result<string | null, string> {
    const api_base = this.request.heliconeHeaders.openaiBaseUrl;
    if (api_base && !this.validateApiConfiguration(api_base)) {
      // return new Response(`Invalid API base "${api_base}"`, {
      return {
        data: null,
        error: `Invalid API base "${api_base}"`,
      };
    }
    return { data: api_base, error: null };
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
