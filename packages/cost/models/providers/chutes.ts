import { BaseProvider } from "./base";

export class ChutesProvider extends BaseProvider {
  readonly displayName = "Chutes";
  readonly baseUrl = "https://api.chutes.ai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://chutes.ai/pricing/"];
  readonly modelPages = ["https://chutes.ai/app"];

  buildUrl(): string {
    return `https://llm.chutes.ai/v1/chat/completions`;
  }

  async buildErrorMessage(response: Response): Promise<{
    message: string;
    details?: any;
  }> {
    try {
      const respJson = (await response.json()) as any;
      return {
        message: respJson.detail?.message || `Request failed with status ${response.status}`
      };
    } catch (error) {
      return { message: `Request failed with status ${response.status}` };
    }
  }
}
