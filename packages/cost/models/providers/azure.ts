import { BaseProvider } from "./base";
import type {
  ModelProviderConfig,
  UserEndpointConfig,
  AuthContext,
  AuthResult,
} from "../types";

export class AzureOpenAIProvider extends BaseProvider {
  readonly displayName = "Azure OpenAI";
  readonly baseUrl = "https://{resourceName}.openai.azure.com";
  readonly auth = "api-key" as const;
  readonly requiredConfig = ["resourceName", "deploymentName"] as const;
  readonly pricingPages = [
    "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/",
  ];
  readonly modelPages = [
    "https://learn.microsoft.com/azure/ai-services/openai/concepts/models",
  ];

  buildUrl(endpoint: ModelProviderConfig, config: UserEndpointConfig): string {
    if (
      !config.baseUri ||
      (!config.deploymentName && !endpoint.providerModelId)
    ) {
      throw new Error("Azure OpenAI requires baseUri and deploymentName");
    }
    const apiVersion = config.apiVersion || "2025-01-01-preview";
    const baseUri = config.baseUri.endsWith("/")
      ? config.baseUri
      : `${config.baseUri}/`;
    const builtUrl = `${baseUri}openai/deployments/${config.deploymentName ?? endpoint.providerModelId}/chat/completions?api-version=${apiVersion}`;
    return builtUrl;
  }

  authenticate(context: AuthContext): AuthResult {
    return {
      headers: {
        "api-key": context.apiKey || "",
      },
    };
  }
}
