import { BaseProvider } from "./base";
import type { Endpoint, RequestParams, AuthContext, AuthResult } from "../types";

export class CerebrasProvider extends BaseProvider {
  readonly displayName = "Cerebras";
  readonly baseUrl = "https://api.cerebras.ai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://www.cerebras.ai/pricing"];
  readonly modelPages = ["https://inference-docs.cerebras.ai/models/overview/"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}
