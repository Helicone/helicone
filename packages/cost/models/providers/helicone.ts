import { BaseProvider } from "./base";
import type { RequestParams, Endpoint } from "../types";

export class HeliconeProvider extends BaseProvider {
  readonly displayName = "Helicone";
  readonly baseUrl = "https://api.novita.ai/openai/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = [];
  readonly modelPages = [];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}/chat/completions`;
  }
}
