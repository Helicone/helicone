import { BaseProvider } from "./base";
import type { RequestParams, Endpoint, RequestBodyContext } from "../types";

export class HeliconeProvider extends BaseProvider {
  readonly displayName = "Helicone";
  readonly baseUrl = "https://inference.helicone.ai/openai/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://helicone.ai/pricing"];
  readonly modelPages = ["https://helicone.ai/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    // Use responses endpoint for pro and codex models
    const isResponsesEndpoint = endpoint.providerModelId.includes("gpt-5-pro") ||
                                 endpoint.providerModelId.includes("gpt-5-codex");

    const path = isResponsesEndpoint ? "/responses" : "/chat/completions";
    return `${this.baseUrl}${path}`;
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    const isResponsesEndpoint = endpoint.providerModelId.includes("gpt-5-pro") ||
                                 endpoint.providerModelId.includes("gpt-5-codex");

    if (isResponsesEndpoint) {
      // Convert messages to input format for /responses endpoint
      const { messages, ...rest } = context.parsedBody;
      let input = "";
      if (Array.isArray(messages)) {
        input = messages.map((m: any) => m.content).join("\n");
      }

      return JSON.stringify({
        ...rest,
        model: endpoint.providerModelId,
        input,
      });
    }

    // Standard chat completions format
    return JSON.stringify({
      ...context.parsedBody,
      model: endpoint.providerModelId,
    });
  }
}
