import { BaseProvider } from "./base";

export class BasetenProvider extends BaseProvider {
  readonly displayName = "Baseten";
  readonly baseUrl = "https://inference.baseten.co/v1/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://www.baseten.co/pricing/"];
  readonly modelPages = ["https://www.baseten.co/library/"];

  buildUrl(): string {
    return `${this.baseUrl}chat/completions`;
  }
}
