import { BaseProvider } from "./base";

export class DeepInfraProvider extends BaseProvider {
  readonly displayName = "DeepInfra";
  readonly baseUrl = "https://api.deepinfra.com/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://deepinfra.com/pricing/"];
  readonly modelPages = ["https://deepinfra.com/models/"];

  buildUrl(): string {
    return `${this.baseUrl}v1/openai`;
  }
}
