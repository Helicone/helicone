import { BaseProvider } from "./base";

export class CanopyWaveProvider extends BaseProvider {
  readonly displayName = "Canopy Wave";
  readonly baseUrl = "https://inference.canopywave.io/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://canopywave.com/pricing"];
  readonly modelPages = ["https://canopywave.com/models"];

  buildUrl(): string {
    return `https://inference.canopywave.io/v1/chat/completions`;
  }
}
