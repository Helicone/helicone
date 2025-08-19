import { BaseProvider } from "./base";

export class OpenAIProvider extends BaseProvider {
  readonly baseUrl = "https://api.openai.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://openai.com/api/pricing"];
  readonly modelPages = ["https://platform.openai.com/docs/models"];

  buildUrl(): string {
    return "https://api.openai.com/v1/chat/completions";
  }
}