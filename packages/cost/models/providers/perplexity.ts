import { BaseProvider } from "./base";

export class PerplexityProvider extends BaseProvider {
  readonly baseUrl = "https://api.perplexity.ai";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://docs.perplexity.ai/guides/pricing"];
  readonly modelPages = ["https://docs.perplexity.ai/guides/models"];

  buildUrl(): string {
    return "https://api.perplexity.ai/chat/completions";
  }
}