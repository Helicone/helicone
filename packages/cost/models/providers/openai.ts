import { BaseProvider } from "./base";
import type { Endpoint, RequestParams, RequestBodyContext } from "../types";

// Allowed OpenAI base URLs for security
const ALLOWED_OPENAI_BASE_URLS = [
  "https://api.openai.com",
  "https://us.api.openai.com", // US data residency
] as const;

export class OpenAIProvider extends BaseProvider {
  readonly displayName = "OpenAI";
  readonly baseUrl = "https://api.openai.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://openai.com/api/pricing"];
  readonly modelPages = ["https://platform.openai.com/docs/models"];

  private validateBaseUrl(baseUrl: string): string {
    // Normalize the URL by removing trailing slash
    const normalized = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

    // Check if the URL is in the allowed list
    if (
      !ALLOWED_OPENAI_BASE_URLS.includes(
        normalized as (typeof ALLOWED_OPENAI_BASE_URLS)[number]
      )
    ) {
      // Fall back to default if not allowed
      return "https://api.openai.com";
    }

    return normalized;
  }

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    // Use custom base URL if provided and valid, otherwise fall back to default
    const baseUrl = this.validateBaseUrl(
      endpoint.userConfig.baseUri || "https://api.openai.com"
    );

    switch (requestParams.bodyMapping) {
      case "RESPONSES":
        return `${baseUrl}/v1/responses`;
      default:
        return `${baseUrl}/v1/chat/completions`;
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
