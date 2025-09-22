import { BaseProvider } from "./base";
import type {
  ModelProviderConfig,
  UserEndpointConfig,
  RequestParams,
} from "../types";

export class OpenAIProvider extends BaseProvider {
  readonly displayName = "OpenAI";
  readonly baseUrl = "https://api.openai.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://openai.com/api/pricing"];
  readonly modelPages = ["https://platform.openai.com/docs/models"];

  buildUrl(
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig,
    requestParams: RequestParams
  ): string {
    return "https://api.openai.com/v1/chat/completions";
  }
}
