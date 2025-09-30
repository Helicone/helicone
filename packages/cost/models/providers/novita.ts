import { BaseProvider } from "./base";
import type { RequestParams, Endpoint } from "../types";

export class NovitaProvider extends BaseProvider {
  readonly displayName = "Novita";
  readonly baseUrl = "https://api.novita.ai/openai/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://novita.ai/pricing/"];
  readonly modelPages = ["https://novita.ai/models/"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}/chat/completions`;
  }
}
