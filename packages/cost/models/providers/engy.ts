import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class EngyProvider extends BaseProvider {
  readonly displayName = "Engy";
  readonly baseUrl = "https://api.engy.ai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://engy.ai/"];
  readonly modelPages = ["https://engy.ai/"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}
