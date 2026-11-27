import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class CaymanAIProvider extends BaseProvider {
  readonly displayName = "Cayman AI";
  readonly baseUrl = "https://strategies-pursue-magazine-graphs.trycloudflare.com/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://willdebonaire.github.io/cayman-ai-site/"];
  readonly modelPages = ["https://strategies-pursue-magazine-graphs.trycloudflare.com/v1/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}/chat/completions`;
  }
}
