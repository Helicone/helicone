import { BaseProvider } from "./base";
import type {
  AuthContext,
  AuthResult,
  Endpoint,
  RequestBodyContext,
  RequestParams,
} from "../types";

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

    // Use responses endpoint for pro/codex models or when bodyMapping is RESPONSES
    const isResponsesEndpoint =
      requestParams.bodyMapping === "RESPONSES" ||
      endpoint.providerModelId.includes("gpt-5-pro") ||
      endpoint.providerModelId.includes("gpt-5-codex");

    const path = isResponsesEndpoint ? "/responses" : "/chat/completions";
    return `${this.baseUrl}/openai/v1${path}`;
  }

  authenticate(authContext: AuthContext, endpoint: Endpoint): AuthResult {
    const headers: Record<string, string> = {};

    // Default to Bearer token auth for OpenAI models
    headers["Authorization"] = `Bearer ${authContext.apiKey || ""}`;

    if (endpoint.providerModelId.includes("sonnet-4")) {
      headers["anthropic-beta"] = "context-1m-2025-08-07";
    }

    return { headers };
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    let updatedBody = context.parsedBody;
    const isAnthropicModel = endpoint.author === "anthropic";
    if (context.bodyMapping === "NO_MAPPING") {
      if (isAnthropicModel) {
        // Ensure system message is in object format if it's a string
        if (typeof updatedBody.system === "string") {
          updatedBody.system = [{ type: "text", text: updatedBody.system }];
        }
        return JSON.stringify({
          ...updatedBody,
          model: endpoint.providerModelId,
        });
      }

      return JSON.stringify({
        ...updatedBody,
        model: endpoint.providerModelId,
      });
    }

    if (isAnthropicModel) {
      const anthropicBody = context.toAnthropic(
        updatedBody,
        endpoint.providerModelId
      );

      if (typeof anthropicBody.system === "string") {
        anthropicBody.system = [{ type: "text", text: anthropicBody.system }];
      }

      return JSON.stringify(anthropicBody);
    }

    // TODO: when anthropic models are supported with Responses API
    // move this converstion BEFORE toAnthropic
    if (context.bodyMapping === "RESPONSES") {
      updatedBody = context.toChatCompletions(updatedBody);
    }

    // Standard format - just pass through with correct model
    return JSON.stringify({
      ...updatedBody,
      model: endpoint.providerModelId,
    });
  }
}
