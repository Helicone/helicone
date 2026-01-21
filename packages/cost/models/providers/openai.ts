import { BaseProvider } from "./base";
import type { Endpoint, RequestParams, RequestBodyContext } from "../types";

export class OpenAIProvider extends BaseProvider {
  readonly displayName = "OpenAI";
  readonly baseUrl = "https://api.openai.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://openai.com/api/pricing"];
  readonly modelPages = ["https://platform.openai.com/docs/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    // Use custom base URL if provided (e.g., for US data residency: us.api.openai.com)
    const baseUrl = endpoint.userConfig.baseUri || "https://api.openai.com";
    const normalizedBaseUrl = baseUrl.endsWith("/")
      ? baseUrl.slice(0, -1)
      : baseUrl;

    switch (requestParams.bodyMapping) {
      case "RESPONSES":
        return `${normalizedBaseUrl}/v1/responses`;
      default:
        return `${normalizedBaseUrl}/v1/chat/completions`;
    }
  }

  buildRequestBody(
    endpoint: Endpoint,
    context: RequestBodyContext
  ): string | Promise<string> {
    if (context.bodyMapping === "RESPONSES") {
      return JSON.stringify({
        ...context.parsedBody,
        model: endpoint.providerModelId,
      });
    }

    return super.buildRequestBody(endpoint, context);
  }
}
