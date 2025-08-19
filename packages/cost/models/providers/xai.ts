import { BaseProvider } from "./base";

export class XAIProvider extends BaseProvider {
  readonly baseUrl = "https://api.x.ai";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://docs.x.ai/docs/pricing"];
  readonly modelPages = ["https://docs.x.ai/docs/models"];

  buildUrl(): string {
    return "https://api.x.ai/v1/chat/completions";
  }
}