import { BaseProvider } from "./base";

export class OpenRouterProvider extends BaseProvider {
  readonly displayName = "OpenRouter";
  readonly baseUrl = "https://openrouter.ai/api/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://openrouter.ai/docs#pricing"];
  readonly modelPages = ["https://openrouter.ai/models"];

  readonly uiConfig = {
    logoUrl: "/assets/home/providers/openrouter.jpg",
    description: "Configure your OpenRouter API keys",
    docsUrl: "https://docs.helicone.ai/getting-started/integration-methods",
    relevanceScore: 35,
  };

  buildUrl(): string {
    return "https://openrouter.ai/api/v1/chat/completions";
  }
}