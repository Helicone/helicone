import { BaseProvider } from "./base";
import type {
  ModelProviderConfig,
  UserEndpointConfig,
  RequestParams,
} from "../types";

export class XAIProvider extends BaseProvider {
  readonly displayName = "xAI";
  readonly baseUrl = "https://api.x.ai";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://docs.x.ai/docs/pricing"];
  readonly modelPages = ["https://docs.x.ai/docs/models"];

  buildUrl(
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig,
    requestParams: RequestParams
  ): string {
    return "https://api.x.ai/v1/chat/completions";
  }
}
