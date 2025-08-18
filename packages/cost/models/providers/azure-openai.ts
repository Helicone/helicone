import { BaseProvider } from "./base";
import type {
  ModelProviderConfig,
  UserEndpointConfig,
  AuthContext,
  AuthResult,
} from "../types";

export class AzureOpenAIProvider extends BaseProvider {
  readonly baseUrl = "https://{resourceName}.openai.azure.com";
  readonly auth = "api-key" as const;
  readonly requiredConfig = ["resourceName", "deploymentName"] as const;
  readonly pricingPages = [
    "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/",
  ];
  readonly modelPages = [
    "https://learn.microsoft.com/azure/ai-services/openai/concepts/models",
  ];

  buildUrl(
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig
  ): string {
    if (!config.resourceName || !config.deploymentName) {
      throw new Error("Azure OpenAI requires resourceName and deploymentName");
    }
    const apiVersion = "2024-02-15-preview";
    return `https://${config.resourceName}.openai.azure.com/openai/deployments/${config.deploymentName}/chat/completions?api-version=${apiVersion}`;
  }

  authenticate(context: AuthContext): AuthResult {
    return {
      headers: {
        "api-key": context.apiKey || "",
      },
    };
  }
}