import { Endpoint, RequestBodyContext } from "../types";
import { BaseProvider } from "./base";

export class MistralProvider extends BaseProvider {
  readonly displayName = "Mistral AI";
  readonly baseUrl = "https://api.mistral.ai/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://mistral.ai/pricing"];
  readonly modelPages = ["https://docs.mistral.ai/getting-started/models"];

  buildUrl(): string {
    return `${this.baseUrl}v1/chat/completions`;
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    let updatedBody = context.parsedBody;
    if (context.bodyMapping === "RESPONSES") {
      updatedBody = context.toChatCompletions(updatedBody);
    }
    return JSON.stringify({
      ...updatedBody,
      model: endpoint.providerModelId,
      user: undefined
    });
  }

  async buildErrorMessage(response: Response): Promise<{
    message: string;
    details?: any;
  }> {
    try {
      const respJson = (await response.json()) as any;
      return {
        message: respJson.message?.detail?.[0]?.msg || respJson.detail?.[0]?.msg || `Request failed with status ${response.status}`, 
        details: respJson.message?.detail || respJson.detail
      };
    } catch (error) {
      return { message: `Request failed with status ${response.status}` };
    }
  }
}
