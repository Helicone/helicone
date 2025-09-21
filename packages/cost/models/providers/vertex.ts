import { BaseProvider } from "./base";
import type {
  ModelProviderConfig,
  UserEndpointConfig,
  RequestBodyContext,
  Endpoint,
  AuthContext,
  AuthResult,
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

  buildUrl(
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig = {}
  ): string {
    const projectId = config.projectId;
    const region = config.region || "us-central1"; // Default region

    if (!projectId || !region) {
      throw new Error("Vertex AI requires projectId and region in config");
    }

    const modelId = endpoint.providerModelId || "";
    const publisher = endpoint.author || "anthropic";
    const baseUrlWithRegion = this.baseUrl.replace("{region}", region);

    return `${baseUrlWithRegion}/v1/projects/${projectId}/locations/${region}/publishers/${publisher}/models/${modelId}:streamRawPredict`;
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    if (endpoint.author === "anthropic") {
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

  async authenticate(context: AuthContext, cacheProvider?: CacheProvider): Promise<AuthResult> {
    if (!context.apiKey) {
      throw new Error(
        "Service account JSON is required for Vertex AI authentication"
      );
    }

    const accessToken = await getGoogleAccessToken(
      context.apiKey,
      context.orgId,
      ["https://www.googleapis.com/auth/cloud-platform"],
      cacheProvider
    );

    return {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }
}
