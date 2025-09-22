import { BaseProvider } from "./base";
import type {
  ModelProviderConfig,
  UserEndpointConfig,
  RequestParams,
} from "../types";

export class CohereProvider extends BaseProvider {
  readonly displayName = "Cohere";
  readonly baseUrl = "https://api.cohere.ai";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://cohere.com/pricing"];
  readonly modelPages = ["https://docs.cohere.com/docs/models"];

  buildUrl(
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig,
    requestParams: RequestParams
  ): string {
    return "https://api.cohere.ai/v1/chat";
  }
}
