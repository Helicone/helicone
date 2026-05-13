import { BaseProvider } from "./base";
import type { Endpoint, RequestBodyContext, RequestParams } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class SaladCloudProvider extends BaseProvider {
  readonly displayName = "SaladCloud";
  readonly baseUrl = "https://ai.salad.cloud/";
  readonly auth = "api-key" as const;
  readonly pricingPages = [
    "https://docs.salad.com/ai-gateway/reference/pricing",
  ];
  readonly modelPages = ["https://docs.salad.com/ai-gateway/reference/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}v1/chat/completions`;
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    let updatedBody = context.parsedBody;
    if (context.bodyMapping === "RESPONSES") {
      updatedBody = context.toChatCompletions(updatedBody);
    }

    const userChatTemplateKwargs = isRecord(updatedBody.chat_template_kwargs)
      ? updatedBody.chat_template_kwargs
      : {};

    return JSON.stringify({
      ...updatedBody,
      model: endpoint.providerModelId,
      chat_template_kwargs: {
        enable_thinking: false,
        ...userChatTemplateKwargs,
      },
    });
  }
}
