import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class SynapProvider extends BaseProvider {
  readonly displayName = "Synap";
  readonly baseUrl = "https://synap402.com/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://synap402.com/v1/models"];
  readonly modelPages = ["https://synap402.com/v1/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}
