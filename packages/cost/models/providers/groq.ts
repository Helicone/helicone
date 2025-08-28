import { BaseProvider } from "./base";

export class GroqProvider extends BaseProvider {
  readonly displayName = "Groq";
  readonly baseUrl = "https://api.groq.com/openai/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://console.groq.com/pricing", "https://groq.com/pricing/"];
  readonly modelPages = ["https://console.groq.com/docs/models"];

  buildUrl(): string {
    return "https://api.groq.com/openai/v1/chat/completions";
  }
}