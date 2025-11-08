import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class NebiusProvider extends BaseProvider {
  readonly displayName = "Nebius Token Factory";
  readonly baseUrl = "https://api.tokenfactory.nebius.com/v1/";
  readonly auth = "api-key" as const;
  readonly pricingPages = [
    "https://nebius.com/token-factory/prices",
    "https://nebius.com/prices",
  ];
  readonly modelPages = ["https://tokenfactory.nebius.com/"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}chat/completions`;
  }
}
