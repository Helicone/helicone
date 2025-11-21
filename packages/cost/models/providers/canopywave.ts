import { BaseProvider } from "./base";

export class DeepInfraProvider extends BaseProvider {
  readonly displayName = "Canopy Wave";
  readonly baseUrl = "https://inference.canopywave.io/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://canopywave.com/pricing"];
  readonly modelPages = ["https://canopywave.com/models"];

  buildUrl(): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}
