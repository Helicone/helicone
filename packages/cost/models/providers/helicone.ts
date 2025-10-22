import { BaseProvider } from "./base";
import type { AuthContext, AuthResult, Endpoint, RequestBodyContext, RequestParams } from "../types";

export class HeliconeProvider extends BaseProvider {
  readonly displayName = "Helicone";
  readonly baseUrl = "https://inference.helicone.ai";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://helicone.ai/pricing"];
  readonly modelPages = ["https://helicone.ai/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    // Check if this is an Anthropic model
    const isAnthropicModel = endpoint.author === "anthropic";

    if (isAnthropicModel) {
      return `${this.baseUrl}/anthropic/v1/messages`;
    }

    // Use responses endpoint for pro and codex models
    const isResponsesEndpoint = endpoint.providerModelId.includes("gpt-5-pro") ||
                                 endpoint.providerModelId.includes("gpt-5-codex");

    const path = isResponsesEndpoint ? "/responses" : "/chat/completions";
    return `${this.baseUrl}/openai/v1${path}`;
  }

  authenticate(authContext: AuthContext): AuthResult {
    const headers: Record<string, string> = {};

    // Default to Bearer token auth for OpenAI models
    headers["Authorization"] = `Bearer ${authContext.apiKey || ""}`;

    return { headers };
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    // Check if this is an Anthropic model
    const isAnthropicModel = endpoint.author === "anthropic";

    if (isAnthropicModel) {
      // Use Anthropic message format (converted from OpenAI format if needed)
      if (context.bodyMapping === "NO_MAPPING") {
        const body = { ...context.parsedBody };

        // Ensure system message is in object format if it's a string
        if (typeof body.system === "string") {
          body.system = [{ type: "text", text: body.system }];
        }

        return JSON.stringify({
          ...body,
          model: endpoint.providerModelId,
        });
      }
      const anthropicBody = context.toAnthropic(context.parsedBody, endpoint.providerModelId);
      return JSON.stringify(anthropicBody);
    }

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

    // Standard chat completions format for OpenAI models
    return JSON.stringify({
      ...context.parsedBody,
      model: endpoint.providerModelId,
    });
  }
}
