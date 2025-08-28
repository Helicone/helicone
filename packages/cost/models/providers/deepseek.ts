import { BaseProvider } from "./base";

export class DeepSeekProvider extends BaseProvider {
  readonly displayName = "DeepSeek";
  readonly baseUrl = "https://api.deepseek.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://api-docs.deepseek.com/"];
  readonly modelPages = ["https://api-docs.deepseek.com/"];

  buildUrl(): string {
    return "https://api.deepseek.com/chat/completions";
  }
}