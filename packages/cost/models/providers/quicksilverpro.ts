import { BaseProvider } from "./base";
import type { RequestParams, Endpoint } from "../types";

export class QuickSilverProProvider extends BaseProvider {
  readonly displayName = "QuickSilver Pro";
  readonly baseUrl = "https://api.quicksilverpro.io/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://quicksilverpro.io/#pricing"];
  readonly modelPages = ["https://quicksilverpro.io/#models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}
