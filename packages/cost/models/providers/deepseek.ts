import { BaseProvider } from "./base";
import type { RequestParams, Endpoint } from "../types";

export class DeepSeekProvider extends BaseProvider {
  readonly displayName = "DeepSeek";
  readonly baseUrl = "https://api.deepseek.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://api-docs.deepseek.com/"];
  readonly modelPages = ["https://api-docs.deepseek.com/"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return "https://api.deepseek.com/chat/completions";
  }
}
