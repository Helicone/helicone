import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class CanopyWaveProvider extends BaseProvider {
  readonly displayName = "Canopy Wave";
  readonly baseUrl = "https://inference.canopywave.io/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://canopywave.com/pricing"];
  readonly modelPages = ["https://canopywave.com/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}