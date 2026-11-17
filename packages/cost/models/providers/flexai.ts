import { BaseProvider } from "./base";

export class FlexAIProvider extends BaseProvider {
  readonly displayName = "FlexAI";
  readonly baseUrl = "https://api.flex.ai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://flex.ai/pricing"];
  readonly modelPages = ["https://flex.ai/models"];

  buildUrl(): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}
