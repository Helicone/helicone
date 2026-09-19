import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class TiyuvtaProvider extends BaseProvider {
  readonly displayName = "Tiyuvta";
  readonly baseUrl = "https://api.tiyuvta.ai/v1/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://inference.tiyuvta.ai/pricing"];
  readonly modelPages = [
    "https://inference.tiyuvta.ai/models/qwen3-8",
    "https://inference.tiyuvta.ai/models/ornith-1-5",
  ];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}chat/completions`;
  }
}
