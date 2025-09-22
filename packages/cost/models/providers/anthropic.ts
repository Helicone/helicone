import { BaseProvider } from "./base";
import type {
  AuthContext,
  AuthResult,
  Endpoint,
  RequestBodyContext,
  RequestParams,
  ResponseFormat,
} from "../types";

export class AnthropicProvider extends BaseProvider {
  readonly displayName = "Anthropic";
  readonly baseUrl = "https://api.anthropic.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = [
    "https://docs.anthropic.com/en/docs/build-with-claude/pricing",
  ];
  readonly modelPages = [
    "https://docs.anthropic.com/en/docs/about-claude/models/all-models",
  ];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return "https://api.anthropic.com/v1/messages";
  }

  authenticate(authContext: AuthContext): AuthResult {
    const headers: Record<string, string> = {};
    headers["x-api-key"] = authContext.apiKey || "";
    if (authContext.bodyMapping === "OPENAI" || !headers["anthropic-version"]) {
      headers["anthropic-version"] = "2023-06-01";
    }
    return { headers };
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    if (context.bodyMapping === "NO_MAPPING") {
      return JSON.stringify({
        ...context.parsedBody,
        model: endpoint.providerModelId,
      });
    }
    const anthropicBody = context.toAnthropic(context.parsedBody, endpoint.providerModelId);
    return JSON.stringify(anthropicBody);
  }

  determineResponseFormat(endpoint: Endpoint): ResponseFormat {
    if (endpoint.author === "anthropic" || endpoint.providerModelId.includes("claude-")) {
      return "ANTHROPIC";
    }
    return "OPENAI";
  }
}
