import { BaseProvider } from "./base";

export class GroqProvider extends BaseProvider {
  readonly displayName = "Groq";
  readonly baseUrl = "https://api.groq.com/openai/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://console.groq.com/pricing", "https://groq.com/pricing/"];
  readonly modelPages = ["https://console.groq.com/docs/models"];

  readonly uiConfig = {
    logoUrl: "/assets/home/providers/groq.png",
    description: "Configure your Groq API keys for fast inference",
    docsUrl: "https://docs.helicone.ai/getting-started/integration-methods/groq",
    relevanceScore: 76,
  };

  buildUrl(): string {
    return "https://api.groq.com/openai/v1/chat/completions";
  }
}