import { BaseProvider } from "./base";

export class RelaxAIProvider extends BaseProvider {
  readonly displayName = "relaxAI";
  readonly baseUrl = "https://api.relax.ai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://relax.ai/docs/getting-started/pricing"];
  readonly modelPages = ["https://relax.ai/docs/getting-started/pricing"];

  buildUrl(): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}