import { BaseProvider } from "./base";
import type { Endpoint, RequestBodyContext, RequestParams } from "../types";

export class OpenRouterProvider extends BaseProvider {
  readonly displayName = "OpenRouter";
  readonly baseUrl = "https://openrouter.ai/api/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://openrouter.ai/docs#pricing"];
  readonly modelPages = ["https://openrouter.ai/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return "https://openrouter.ai/api/v1/chat/completions";
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string | Promise<string> {
    let updatedBody = context.parsedBody;
    if (context.bodyMapping === "RESPONSES") {
      updatedBody = context.toChatCompletions(updatedBody);
    }
    return JSON.stringify({
      ...updatedBody,
      model: endpoint.providerModelId,
      usage: { include: true }
    });
  }
}
