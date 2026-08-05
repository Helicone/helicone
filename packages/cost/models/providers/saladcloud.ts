import { BaseProvider } from "./base";

export class SaladCloudProvider extends BaseProvider {
  readonly displayName = "SaladCloud AI Gateway";
  readonly baseUrl = "https://ai.salad.cloud/v1/";
  readonly auth = "api-key" as const;
  readonly pricingPages = [
    "https://docs.salad.com/ai-gateway/reference/pricing",
  ];
  readonly modelPages = ["https://docs.salad.com/ai-gateway/reference/models"];

  buildUrl(): string {
    return `${this.baseUrl}chat/completions`;
  }
}
