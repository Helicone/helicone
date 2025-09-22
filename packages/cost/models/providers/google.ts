import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class GoogleProvider extends BaseProvider {
  readonly displayName = "Google AI Studio";
  readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://ai.google.dev/gemini-api/docs/pricing"];
  readonly modelPages = ["https://ai.google.dev/gemini-api/docs/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  }
}
