import { BaseProvider } from "./base";

export class GoogleProvider extends BaseProvider {
  readonly displayName = "Google AI (Gemini)";
  readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://ai.google.dev/gemini-api/docs/pricing"];
  readonly modelPages = ["https://ai.google.dev/gemini-api/docs/models"];

  readonly uiConfig = {
    logoUrl: "/assets/home/providers/gemini.webp",
    description: "Configure your Gemini API Keys",
    docsUrl: "https://docs.helicone.ai/integrations/gemini/api/curl",
    relevanceScore: 84,
  };

  buildUrl(): string {
    return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  }
}
