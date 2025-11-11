import { BaseProvider } from "./base";
import type { AuthContext, AuthResult } from "../types";

export class FireworksProvider extends BaseProvider {
  readonly displayName = "Fireworks";
  readonly baseUrl = "https://api.fireworks.ai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://fireworks.ai/pricing/"];
  readonly modelPages = ["https://fireworks.ai/models/"];

  buildUrl(): string {
    return `${this.baseUrl}inference/v1/chat/completions`;
  }

  authenticate(authContext: AuthContext): AuthResult {
    return {
      headers: {
        "api-key": authContext.apiKey || "",
      },
    };
  }
}
