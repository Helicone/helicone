import { BaseProvider } from "./base";

export class CohereProvider extends BaseProvider {
  readonly displayName = "Cohere";
  readonly baseUrl = "https://api.cohere.ai";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://cohere.com/pricing"];
  readonly modelPages = ["https://docs.cohere.com/docs/models"];

  buildUrl(): string {
    return "https://api.cohere.ai/v1/chat";
  }
}