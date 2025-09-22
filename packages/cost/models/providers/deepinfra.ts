import { BaseProvider } from "./base";
import type { RequestParams, Endpoint } from "../types";

export class DeepInfraProvider extends BaseProvider {
  readonly displayName = "DeepInfra";
  readonly baseUrl = "https://api.deepinfra.com/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://deepinfra.com/pricing/"];
  readonly modelPages = ["https://deepinfra.com/models/"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}v1/openai/chat/completions`;
  }
}
