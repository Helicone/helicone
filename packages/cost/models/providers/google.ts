import { BaseProvider } from "./base";
import type { Endpoint, RequestParams, AuthContext, AuthResult, RequestBodyContext } from "../types";
import type { CacheProvider } from "../../../common/cache/provider";
import { toGoogle } from "@helicone-package/llm-mapper/transform/providers/openai/request/toGoogle";

export class GoogleProvider extends BaseProvider {
  readonly displayName = "Google AI Studio";
  readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://ai.google.dev/gemini-api/docs/pricing"];
  readonly modelPages = ["https://ai.google.dev/gemini-api/docs/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    const modelId = endpoint.providerModelId || "";
    const modelPath = modelId.startsWith("models/")
      ? modelId
      : `models/${modelId}`;

    if (requestParams.isStreaming) {
      return `${this.baseUrl}/${modelPath}:streamGenerateContent?alt=sse&key=${requestParams.apiKey}`;
    }
    else {
      return `${this.baseUrl}/${modelPath}:generateContent?key=${requestParams.apiKey}`;
    }
  }

  // Override authenticate to return empty headers since auth is in URL query param
  authenticate(
    authContext: AuthContext,
    endpoint: Endpoint,
    cacheProvider?: CacheProvider
  ): AuthResult {
    return {
      headers: {},
    };
  }

  // Transform OpenAI format to Google's native format
  buildRequestBody(
    endpoint: Endpoint,
    context: RequestBodyContext
  ): string {
    const modelId = endpoint.providerModelId || "";
    if (context.bodyMapping === "NO_MAPPING") {
      // Strip context_editing - only supported by Anthropic
      const { context_editing, ...bodyWithoutContextEditing } = context.parsedBody;
      return JSON.stringify({
        ...bodyWithoutContextEditing,
        model: modelId,
      });
    }

    let updatedBody = context.parsedBody;

    // Convert to Chat Completions
    if (context.bodyMapping === "RESPONSES") {
      updatedBody = context.toChatCompletions(context.parsedBody);
    }

    // Strip context_editing - only supported by Anthropic
    const { context_editing, ...bodyWithoutContextEditing } = updatedBody;

    const googleBody = toGoogle(bodyWithoutContextEditing);
    return JSON.stringify(googleBody);
  }
}
