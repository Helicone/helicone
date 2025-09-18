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
    // If it's PTB and no baseUri provided, use Helicone's Azure baseUri
    const effectiveConfig = {
      ...config,
      ...(endpoint.ptbEnabled && !config.baseUri
        ? {
            baseUri: "https://helicone-gateway.cognitiveservices.azure.com",
          }
        : {}),
    };

    if (
      !effectiveConfig.baseUri ||
      (!effectiveConfig.deploymentName && !endpoint.providerModelId)
    ) {
      throw new Error("Azure OpenAI requires baseUri and deploymentName");
    }
    const apiVersion = effectiveConfig.apiVersion || "2025-01-01-preview";
    const baseUri = effectiveConfig.baseUri.endsWith("/")
      ? effectiveConfig.baseUri
      : `${effectiveConfig.baseUri}/`;
    const builtUrl = `${baseUri}openai/deployments/${effectiveConfig.deploymentName ?? endpoint.providerModelId}/chat/completions?api-version=${apiVersion}`;
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
