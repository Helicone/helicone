import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class ScalatticeProvider extends BaseProvider {
  readonly displayName = "Scalattice";
  readonly baseUrl = "https://api.scalattice.cloud/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://scalattice.com/pricing/"];
  readonly modelPages = ["https://scalattice.cloud/docs/developers"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}/chat/completions`;
  }
}
