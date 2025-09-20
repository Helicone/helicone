import { BaseProvider } from "./base";

export class OpenAIProvider extends BaseProvider {
  readonly displayName = "OpenAI";
  readonly baseUrl = "https://api.openai.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://openai.com/api/pricing"];
  readonly modelPages = ["https://platform.openai.com/docs/models"];

  readonly uiConfig = {
    logoUrl: "/assets/providers/openai.webp",
    description: "Configure your OpenAI API keys for testing and development",
    docsUrl: "https://docs.helicone.ai/getting-started/integration-methods/openai",
    relevanceScore: 100,
  };

  buildUrl(): string {
    return "https://api.openai.com/v1/chat/completions";
  }
}