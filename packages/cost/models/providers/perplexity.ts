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

  async buildErrorMessage(response: Response): Promise<{
    message: string;
    details?: any;
  }> {
    try {
      const respJson = (await response.json()) as any;
      return {
        message: respJson.error?.message || `Request failed with status ${response.status}`
      };
    } catch (error) {
      return { message: `Request failed with status ${response.status}` };
    }
  }
}
