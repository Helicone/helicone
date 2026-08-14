import { BaseProvider } from "./base";

export class ScxProvider extends BaseProvider {
  readonly displayName = "SCX.ai";
  readonly baseUrl = "https://api.scx.ai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://scx.ai/pricing"];
  readonly modelPages = ["https://scx.ai/models"];

  buildUrl(): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}
