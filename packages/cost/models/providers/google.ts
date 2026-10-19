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

  // The API key is sent in the x-goog-api-key header, never in the URL: URLs
  // end up in request logs, traces and error messages, headers do not.
  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    const modelId = endpoint.providerModelId || "";
    const modelPath = modelId.startsWith("models/")
      ? modelId
      : `models/${modelId}`;

    if (requestParams.isStreaming) {
      return `${this.baseUrl}/${modelPath}:streamGenerateContent?alt=sse`;
    }
    return `${this.baseUrl}/${modelPath}:generateContent`;
  }

  authenticate(
    authContext: AuthContext,
    endpoint: Endpoint,
    cacheProvider?: CacheProvider
  ): AuthResult {
    return {
      headers: {
        "x-goog-api-key": authContext.apiKey || "",
      },
    };
  }

  // Transform OpenAI format to Google's native format
  buildRequestBody(
    endpoint: Endpoint,
    context: RequestBodyContext
  ): string {
    const modelId = endpoint.providerModelId || "";
    if (context.bodyMapping === "NO_MAPPING") {
      return JSON.stringify({
        ...context.parsedBody,
        model: modelId,
      });
    }

    let updatedBody = context.parsedBody;

    // Convert to Chat Completions
    if (context.bodyMapping === "RESPONSES") {
      updatedBody = context.toChatCompletions(context.parsedBody);
    }

    const googleBody = toGoogle(updatedBody);
    return JSON.stringify(googleBody);
  }
}
