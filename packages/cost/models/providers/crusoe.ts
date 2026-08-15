import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class CrusoeProvider extends BaseProvider {
  readonly displayName = "Crusoe";
  readonly baseUrl = "https://api.inference.crusoecloud.com/v1/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://www.crusoe.ai/cloud/pricing"];
  readonly modelPages = [
    "https://docs.crusoecloud.com/managed-inference/overview",
  ];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}chat/completions`;
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
          respJson.detail ||
          `Request failed with status ${response.status}`,
      };
    } catch (error) {
      return { message: `Request failed with status ${response.status}` };
    }
  }
}
