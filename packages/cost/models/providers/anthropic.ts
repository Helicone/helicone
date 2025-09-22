import { BaseProvider } from "./base";
import type {
  AuthContext,
  AuthResult,
  ModelProviderConfig,
  UserEndpointConfig,
  Endpoint,
  RequestBodyContext,
  RequestParams,
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

  buildUrl(
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig,
    requestParams: RequestParams
  ): string {
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
    const anthropicBody = context.toAnthropic(context.parsedBody);
    return JSON.stringify(anthropicBody);
  }
}
