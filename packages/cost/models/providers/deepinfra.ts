import { BaseProvider } from "./base";
import type { ModelProviderConfig, UserEndpointConfig } from "../types";

export class DeepInfraProvider extends BaseProvider {
  readonly displayName = "DeepInfra";
  readonly baseUrl = "https://api.deepinfra.com/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://deepinfra.com/pricing/"];
  readonly modelPages = ["https://deepinfra.com/models/"];

  readonly uiConfig = {
    logoUrl: "/assets/home/providers/deepinfra.webp",
    description: "Configure your DeepInfra API keys for fast and affordable inference",
    docsUrl: "https://docs.helicone.ai/getting-started/integration-methods",
    relevanceScore: 40,
  };

  buildUrl(endpoint: ModelProviderConfig, config: UserEndpointConfig): string {
    return `${this.baseUrl}v1/openai/chat/completions`;
  }
}
