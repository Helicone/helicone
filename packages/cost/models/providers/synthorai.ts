import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class SynthoraiProvider extends BaseProvider {
  readonly displayName = "Synthorai";

  readonly baseUrl = "https://synthorai.io/";

  readonly auth = "api-key" as const;

  readonly pricingPages: string[] = [];
  readonly modelPages: string[] = [];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}
