import { BaseProvider } from "./base";
import type { AuthContext, AuthResult } from "../types";

export class AnthropicProvider extends BaseProvider {
  readonly baseUrl = "https://api.anthropic.com";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://docs.anthropic.com/en/docs/build-with-claude/pricing"];
  readonly modelPages = ["https://docs.anthropic.com/en/docs/about-claude/models/all-models"];

  buildUrl(): string {
    return "https://api.anthropic.com/v1/chat/completions";
  }

  authenticate(context: AuthContext): AuthResult {
    const headers: Record<string, string> = {};
    if (context.bodyMapping === "NO_MAPPING") {
      headers["x-api-key"] = context.apiKey || "";
    } else {
      headers["Authorization"] = `Bearer ${context.apiKey || ""}`;
    }
    return { headers };
  }
}