import { BaseProvider } from "./base";
import type {
  RequestBodyContext,
  Endpoint,
  AuthContext,
  AuthResult,
  RequestParams,
  ResponseFormat,
} from "../types";
import { getGoogleAccessToken } from "../../auth/gcpServiceAccountAuth";
import { CacheProvider } from "../../../common/cache/provider";
import { toGoogle } from "@helicone-package/llm-mapper/transform/providers/openai/request/toGoogle";

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
    const modelSupportsCrossRegion = endpoint.modelConfig.crossRegion;
    const userCrossRegionEnabled = endpoint.userConfig.crossRegion;
    const projectId = endpoint.userConfig.projectId;

    let region: string;
    if (userCrossRegionEnabled && modelSupportsCrossRegion) {
      region = "global";
    } else if (userCrossRegionEnabled && !modelSupportsCrossRegion) {
      region = endpoint.userConfig.region || "us-east5";
    } else {
      region = endpoint.userConfig.region || "us-central1";
    }

    if (modelId.toLowerCase().includes("gemini")) {
      if (!projectId) {
        throw new Error(
          "Vertex AI requires projectId in config for Gemini models"
        );
      }
      const baseUrlWithRegion =
        region === "global"
          ? "https://aiplatform.googleapis.com"
          : this.baseUrl.replace("{region}", region);

      const baseEndpointUrl = `${baseUrlWithRegion}/v1beta1/projects/${projectId}/locations/${region}/publishers/google/models/${modelId}`;
      const suffix = requestParams.isStreaming
        ? ":streamGenerateContent?alt=sse"
        : ":generateContent";

      return `${baseEndpointUrl}${suffix}`;
    }

    if (!projectId || !region) {
      throw new Error(
        "Vertex AI requires projectId and region in config for non-Gemini models"
      );
    }

    const publisher = endpoint.author || "anthropic";
    const baseUrlWithRegion =
      region === "global"
        ? "https://aiplatform.googleapis.com"
        : this.baseUrl.replace("{region}", region);

    const baseEndpointUrl = `${baseUrlWithRegion}/v1/projects/${projectId}/locations/${region}/publishers/${publisher}/models/${modelId}`;

    // Gemini models use Google's predict format; all others use rawPredict for native format
    const isStreaming = requestParams.isStreaming === true;
    const endpointMethod = isStreaming
      ? "streamRawPredict"
      : "rawPredict";

    return `${baseEndpointUrl}:${endpointMethod}`;
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    const modelId = endpoint.providerModelId || "";
    if (context.bodyMapping === "NO_MAPPING") {
      // For Claude models on Vertex, still need to add anthropic_version
      // even when the body is already in Anthropic format (NO_MAPPING)
      if (modelId.includes("claude-")) {
        return JSON.stringify({
          ...context.parsedBody,
          anthropic_version: "vertex-2023-10-16",
          model: undefined,
        });
      }
      return JSON.stringify({
        ...context.parsedBody,
        model: modelId,
      });
    }

    let updatedBody = context.parsedBody;

    // Convert to Chat Completions
    if (context.bodyMapping === "RESPONSES") {
      updatedBody = context.toChatCompletions(context.parsedBody);
    }

    if (modelId.toLowerCase().includes("gemini")) {
      const geminiBody = toGoogle(updatedBody);
      return JSON.stringify(geminiBody);
    }

    if (endpoint.providerModelId.includes("claude-")) {
      const anthropicBody = context.toAnthropic(
        updatedBody,
        endpoint.providerModelId,
        { includeCacheBreakpoints: true }
      );
      updatedBody = {
        ...anthropicBody,
        anthropic_version: "vertex-2023-10-16",
        model: undefined, // model is not needed in Vertex inputs (as its defined via URL)
      };
      console.log("Anthropic Body for Vertex:", JSON.stringify(updatedBody, null, 2));
      return JSON.stringify(updatedBody);
    }

    // Pass through
    return JSON.stringify({
      ...context.parsedBody,
      model: endpoint.providerModelId,
    });
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
        ...(endpoint.providerModelId.includes("sonnet-4") ? {
          "anthropic-beta": "context-1m-2025-08-07"
        } : {})
      },
    };
  }

  async buildErrorMessage(response: Response): Promise<{
    message: string;
    details?: any;
  }> {
    try {
      const respJson = (await response.json()) as any;
      if (respJson.error?.message) {
        // Anthropic error format
        return { message: respJson.error.message, details: respJson.error };
      } else if (respJson[0]?.error?.message) {
        // Gemini error format
        return { message: respJson[0].error.message, details: respJson[0].error };
      }
      return { message: `Request failed with status ${response.status}`, details: undefined };
    } catch (error) {
      return { message: `Request failed with status ${response.status}`, details: undefined };
    }
  }

}
