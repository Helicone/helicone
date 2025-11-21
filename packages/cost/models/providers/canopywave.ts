import { BaseProvider } from "./base";
import type { RequestParams, Endpoint } from "../types";

export class CanopyWaveProvider extends BaseProvider {
  readonly displayName = "CanopyWave";
  readonly baseUrl = "https://inference.canopywave.io";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://canopywave.com/pricing"];
  readonly modelPages = ["https://canopywave.com/models"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return "https://inference.canopywave.io/v1/chat/completions";
  }

  async buildErrorMessage(response: Response): Promise<{
    message: string;
    details?: any;
  }> {
    try {
      const respJson = (await response.json()) as any;
      return {
        message:
          respJson.error?.message ||
          `Request failed with status ${response.status}`,
      };
    } catch (error) {
      return { message: `Request failed with status ${response.status}` };
    }
  }
}
