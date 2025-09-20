import { BaseProvider } from "./base";

export class DeepSeekProvider extends BaseProvider {
  readonly displayName = "DeepSeek";
  readonly baseUrl = "https://api.deepseek.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://api-docs.deepseek.com/"];
  readonly modelPages = ["https://api-docs.deepseek.com/"];

  readonly uiConfig = {
    logoUrl: "/assets/home/providers/anthropic.png",
    description: "Configure your DeepSeek API keys",
    docsUrl: "https://docs.helicone.ai/getting-started/integration-methods",
    relevanceScore: 70,
  };

  buildUrl(): string {
    return "https://api.deepseek.com/chat/completions";
  }
}