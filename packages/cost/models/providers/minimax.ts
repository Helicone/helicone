import { BaseProvider } from "./base";
import type { RequestParams, Endpoint } from "../types";

export class MiniMaxProvider extends BaseProvider {
  readonly displayName = "MiniMax";
  readonly baseUrl = "https://api.minimax.io";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://platform.minimaxi.com/document/Price"];
  readonly modelPages = [
    "https://platform.minimaxi.com/document/Models",
  ];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}/v1/chat/completions`;
  }
}
