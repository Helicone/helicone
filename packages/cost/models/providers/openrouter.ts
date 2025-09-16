import { BaseProvider } from "./base";

export class OpenRouterProvider extends BaseProvider {
  readonly displayName = "OpenRouter";
  readonly baseUrl = "https://openrouter.ai/api/v1";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://openrouter.ai/docs#pricing"];
  readonly modelPages = ["https://openrouter.ai/models"];

  buildUrl(): string {
    return "https://openrouter.ai/api/v1/chat/completions";
  }
}