import { BaseProvider } from "./base";
import type {
  AuthContext,
  AuthResult,
  Endpoint,
  RequestBodyContext,
  RequestParams,
  PluginId,
} from "../types";

export class AnthropicProvider extends BaseProvider {
  readonly displayName = "Anthropic";
  readonly baseUrl = "https://api.anthropic.com";
  readonly auth = "api-key" as const;
  readonly supportedPlugins: PluginId[] = ["web"];
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
    let updatedBody = context.parsedBody;

    if (context.bodyMapping === "RESPONSES") {
      updatedBody = context.toChatCompletions(context.parsedBody);
    }
    const anthropicBody = context.toAnthropic(updatedBody, endpoint.providerModelId);
    return JSON.stringify(anthropicBody);
  }

}
