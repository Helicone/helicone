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
    // Determine base URI - use provided or Helicone gateway for PTB
    const baseUri = config.baseUri ||
      (endpoint.ptbEnabled ? "https://helicone-gateway.cognitiveservices.azure.com" : null);

    if (!baseUri) {
      throw new Error("Azure OpenAI requires baseUri");
    }

    // Get deployment name - fallback chain: deploymentName -> providerModelId -> modelName
    const deploymentName = config.deploymentName?.trim();
    const deployment = deploymentName || endpoint.providerModelId || config.modelName;

    if (!deployment) {
      throw new Error("Azure OpenAI requires a deployment name, provider model ID, or model name");
    }

    // Build URL with normalized base URI and API version
    const normalizedBaseUri = baseUri.endsWith("/") ? baseUri : `${baseUri}/`;
    const apiVersion = config.apiVersion || "2025-01-01-preview";

    return `${normalizedBaseUri}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  }

  authenticate(context: AuthContext): AuthResult {
    return {
      headers: {
        "api-key": context.apiKey || "",
      },
    };
  }
}
