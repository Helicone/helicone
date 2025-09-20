import { BaseProvider } from "./base";

export class XAIProvider extends BaseProvider {
  readonly displayName = "X.AI (Grok)";
  readonly baseUrl = "https://api.x.ai";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://docs.x.ai/docs/pricing"];
  readonly modelPages = ["https://docs.x.ai/docs/models"];

  readonly uiConfig = {
    logoUrl: "/assets/providers/grok.webp",
    description: "Configure your X.AI API keys for Grok models",
    docsUrl: "https://docs.helicone.ai/getting-started/integration-methods",
    relevanceScore: 68,
  };

  buildUrl(): string {
    return "https://api.x.ai/v1/chat/completions";
  }
}
