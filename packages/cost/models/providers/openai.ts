import { BaseProvider } from "./base";
import type { Endpoint, RequestParams, RequestBodyContext } from "../types";

export class OpenAIProvider extends BaseProvider {
  readonly displayName = "OpenAI";
  readonly baseUrl = "https://api.openai.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://openai.com/api/pricing"];
  readonly modelPages = ["https://platform.openai.com/docs/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    switch (requestParams.bodyMapping) {
      case "RESPONSES":
        return "https://api.openai.com/v1/responses";
      default:
        return "https://api.openai.com/v1/chat/completions";
    }
  }

  buildRequestBody(
    endpoint: Endpoint,
    context: RequestBodyContext
  ): string | Promise<string> {
    if (context.bodyMapping === "RESPONSES") {
      // Strip context_editing - only supported by Anthropic
      const { context_editing, ...bodyWithoutContextEditing } = context.parsedBody;
      return JSON.stringify({
        ...bodyWithoutContextEditing,
        model: endpoint.providerModelId,
      });
    }

    return super.buildRequestBody(endpoint, context);
  }
}
