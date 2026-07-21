import { BaseProvider } from "./base";

export class StarveriProvider extends BaseProvider {
  readonly displayName = "Starveri";
  readonly baseUrl = "https://api.starveri.net/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://api.starveri.net/models"];
  readonly modelPages = ["https://api.starveri.net/models"];

  buildUrl(): string {
    return "https://api.starveri.net/v1/chat/completions";
  }
}
