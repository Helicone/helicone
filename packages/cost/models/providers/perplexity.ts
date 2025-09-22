import { BaseProvider } from "./base";
import type { RequestParams, Endpoint } from "../types";

export class PerplexityProvider extends BaseProvider {
  readonly displayName = "Perplexity";
  readonly baseUrl = "https://api.perplexity.ai";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://docs.perplexity.ai/guides/pricing"];
  readonly modelPages = ["https://docs.perplexity.ai/guides/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return "https://api.perplexity.ai/chat/completions";
  }
}
