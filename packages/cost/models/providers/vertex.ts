import { BaseProvider } from "./base";
import type {
  ModelProviderConfig,
  UserEndpointConfig,
  RequestBodyContext,
  Endpoint,
} from "../types";

export class VertexProvider extends BaseProvider {
  readonly displayName = "Vertex AI";
  readonly baseUrl = "https://{region}-aiplatform.googleapis.com";
  readonly auth = "oauth" as const;
  readonly requiredConfig = ["projectId", "region"] as const;
  readonly pricingPages = [
    "https://cloud.google.com/vertex-ai/generative-ai/pricing",
    "https://ai.google.dev/pricing",
  ];
  readonly modelPages = [
    "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models",
  ];

  buildUrl(
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig = {}
  ): string {
    if (!config.projectId || !config.region) {
      throw new Error("Vertex AI requires projectId and region");
    }
    const modelId = endpoint.providerModelId || "";
    const baseUrlWithRegion = this.baseUrl.replace("{region}", config.region);
    return `${baseUrlWithRegion}/v1/projects/${config.projectId}/locations/${config.region}/publishers/anthropic/models/${modelId}:streamRawPredict`;
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    if (endpoint.providerModelId.includes("claude-")) {
      const anthropicBody =
        context.bodyMapping === "OPENAI"
          ? context.toAnthropic(context.parsedBody)
          : context.parsedBody;
      const updatedBody = {
        ...anthropicBody,
        anthropic_version: "vertex-2023-10-16",
        model: undefined,
      };
      return JSON.stringify(updatedBody);
    }
    return JSON.stringify(context.parsedBody);
  }
}
