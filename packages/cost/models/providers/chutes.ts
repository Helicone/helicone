import { BaseProvider } from "./base";

export class ChutesProvider extends BaseProvider {
  readonly displayName = "Chutes";
  readonly baseUrl = "https://api.chutes.ai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://chutes.ai/pricing/"];
  readonly modelPages = ["https://chutes.ai/app"];

  buildUrl(): string {
    return `https://llm.chutes.ai/v1/chat/completions`;
  }
}
