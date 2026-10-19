import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class AtlasCloudProvider extends BaseProvider {
  readonly displayName = "Atlas Cloud";
  readonly baseUrl = "https://api.atlascloud.ai/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://www.atlascloud.ai/"];
  readonly modelPages = ["https://www.atlascloud.ai/"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return "https://api.atlascloud.ai/v1/chat/completions";
  }
}
