import { BaseProvider } from "./base";
import type { RequestParams, Endpoint } from "../types";

export class IoIntelligenceProvider extends BaseProvider {
  readonly displayName = "io.net Intelligence";
  readonly baseUrl = "https://api.intelligence.io.solutions/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://io.net/"];
  readonly modelPages = ["https://io.net/"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}api/v1/chat/completions`;
  }
}
