import { BaseProvider } from "./base";
import type {
  AuthContext,
  AuthResult,
  RequestParams,
  Endpoint,
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

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    // Determine base URI - use provided or Helicone gateway for PTB
    const baseUri =
      endpoint.userConfig.baseUri ||
      (endpoint.ptbEnabled
        ? "https://east1-gateway-resource.cognitiveservices.azure.com/"
        : null);

    if (!baseUri) {
      throw new Error("Azure OpenAI requires baseUri");
    }

    // Get deployment name - fallback chain: deploymentName -> providerModelId -> modelName
    const deploymentName = endpoint.userConfig.deploymentName?.trim();
    const deployment =
      deploymentName ||
      endpoint.providerModelId ||
      endpoint.userConfig.modelName;

    if (!deployment) {
      throw new Error(
        "Azure OpenAI requires a deployment name, provider model ID, or model name"
      );
    }

    // Build URL with normalized base URI and API version
    const normalizedBaseUri = baseUri.endsWith("/") ? baseUri : `${baseUri}/`;
    const apiVersion = endpoint.userConfig.apiVersion || "2025-01-01-preview";

    return `${normalizedBaseUri}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  }

  authenticate(authContext: AuthContext): AuthResult {
    return {
      headers: {
        "api-key": authContext.apiKey || "",
      },
    };
  }
}
