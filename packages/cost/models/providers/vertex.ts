import { BaseProvider } from "./base";
import type {
  RequestBodyContext,
  Endpoint,
  AuthContext,
  AuthResult,
  RequestParams,
} from "../types";
import { getGoogleAccessToken } from "../../auth/gcpServiceAccountAuth";
import { CacheProvider } from "../../../common/cache/provider";

export class VertexProvider extends BaseProvider {
  readonly displayName = "Vertex AI";
  readonly baseUrl = "https://{region}-aiplatform.googleapis.com";
  readonly auth = "service_account" as const;
  readonly requiredConfig = ["projectId", "region"] as const;
  readonly pricingPages = [
    "https://cloud.google.com/vertex-ai/generative-ai/pricing",
    "https://ai.google.dev/pricing",
  ];
  readonly modelPages = [
    "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models",
  ];

  readonly uiConfig = {
    logoUrl: "/assets/home/providers/gemini.webp",
    description:
      "Configure your Google Cloud service account for Vertex AI models",
    docsUrl: "https://docs.helicone.ai/integrations/gemini/vertex/curl",
    relevanceScore: 85,
  };

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    const modelId = endpoint.providerModelId || "";
    const projectId = endpoint.userConfig.projectId;
    const region = endpoint.userConfig.region || "us-central1";

    if (modelId.toLowerCase().includes("gemini")) {
      if (!projectId) {
        throw new Error(
          "Vertex AI requires projectId in config for Gemini models"
        );
      }

      const baseUrlWithRegion = this.baseUrl.replace("{region}", region);
      return `${baseUrlWithRegion}/v1beta1/projects/${projectId}/locations/${region}/endpoints/openapi/chat/completions`;
    }

    if (!projectId || !region) {
      throw new Error(
        "Vertex AI requires projectId and region in config for non-Gemini models"
      );
    }

    const publisher = endpoint.author || "anthropic";
    const baseUrlWithRegion = this.baseUrl.replace("{region}", region);
    const baseEndpointUrl = `${baseUrlWithRegion}/v1/projects/${projectId}/locations/${region}/publishers/${publisher}/models/${modelId}`;

    // Determine the endpoint based on streaming
    const isStreaming = requestParams.isStreaming === true;
    return `${baseEndpointUrl}:${isStreaming ? "streamRawPredict" : "predict"}`;
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    const modelId = endpoint.providerModelId || "";

    if (modelId.toLowerCase().includes("gemini")) {
      const updatedBody = {
        ...context.parsedBody,
        model: `google/${modelId}`,
      };
      return JSON.stringify(updatedBody);
    }

    if (endpoint.author === "anthropic") {
      const anthropicBody =
        context.bodyMapping === "OPENAI"
          ? context.toAnthropic(context.parsedBody, endpoint.providerModelId)
          : context.parsedBody;
      const updatedBody = {
        ...anthropicBody,
        anthropic_version: "vertex-2023-10-16",
        model: undefined, // model is not needed in Vertex inputs (as its defined via URL)
      };
      return JSON.stringify(updatedBody);
    }
    return JSON.stringify(context.parsedBody);
  }

  async authenticate(
    authContext: AuthContext,
    endpoint: Endpoint,
    cacheProvider?: CacheProvider
  ): Promise<AuthResult> {
    if (!authContext.apiKey) {
      throw new Error(
        "Service account JSON is required for Vertex AI authentication"
      );
    }

    const accessToken = await getGoogleAccessToken(
      authContext.apiKey,
      authContext.orgId,
      ["https://www.googleapis.com/auth/cloud-platform"],
      cacheProvider
    );

    return {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  async buildErrorMessage(response: Response): Promise<string> {
    try {
      const respJson = (await response.json()) as any;
      // const respJson = (await response.json()) as any;
      if (respJson.error?.message) { // Anthropic error format
        return respJson.error.message;
      } else if (respJson[0]?.error?.message) { // Gemini error format
        return respJson[0].error.message;
      }
      return `Request failed with status ${response.status}`;
    } catch (error) {
      return `Request failed with status ${response.status}`;
    }
  }
}
