import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class NebiusProvider extends BaseProvider {
  readonly displayName = "Nebius";
  readonly baseUrl = "https://api.studio.nebius.com/v1/";
  readonly auth = "api-key" as const;
  readonly pricingPages = [
    "https://nebius.com/prices-ai-studio",
    "https://nebius.com/prices",
  ];
  readonly modelPages = ["https://studio.nebius.com/"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}chat/completions`;
  }
}
