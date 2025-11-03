import { BaseProvider } from "./base";

export class MistralAIProvider extends BaseProvider {
  readonly displayName = "DeepInfra";
  readonly baseUrl = "https://api.mistral.ai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://mistral.ai/pricing"];
  readonly modelPages = ["https://docs.mistral.ai/getting-started/models"];

  buildUrl(): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}
