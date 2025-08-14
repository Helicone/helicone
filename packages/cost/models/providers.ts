/**
 * Provider configurations for URL and model ID building
 */

import { err, ok, Result } from "../../common/result";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import type {
  ProviderConfig,
  Endpoint,
  UserConfig,
  ProviderName,
  AuthContext,
  AuthResult,
} from "./types";

export const providers = {
  anthropic: {
    id: "anthropic",
    baseUrl: "https://api.anthropic.com",
    auth: "api-key",
    buildUrl: () => "https://api.anthropic.com/v1/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
    authenticate: (context) => {
      const headers: Record<string, string> = {};
      if (context.bodyMapping === "NO_MAPPING") {
        headers["x-api-key"] = context.apiKey || "";
      } else {
        headers["Authorization"] = `Bearer ${context.apiKey || ""}`;
      }
      return { headers };
    },
    pricingPages: [
      "https://docs.anthropic.com/en/docs/build-with-claude/pricing",
    ],
    modelPages: [
      "https://docs.anthropic.com/en/docs/about-claude/models/all-models",
    ],
  },

  openai: {
    id: "openai",
    baseUrl: "https://api.openai.com",
    auth: "api-key",
    buildUrl: () => "https://api.openai.com/v1/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
    authenticate: (context) => {
      return {
        headers: {
          Authorization: `Bearer ${context.apiKey || ""}`,
        },
      };
    },
    pricingPages: ["https://openai.com/api/pricing"],
    modelPages: ["https://platform.openai.com/docs/models"],
  },

  bedrock: {
    id: "bedrock",
    baseUrl: "https://bedrock-runtime.{region}.amazonaws.com",
    auth: "aws-signature",
    requiredConfig: ["region"],
    buildUrl: (endpoint, config) => {
      const region = config.region || endpoint.region || "us-west-2";
      const modelId = endpoint.providerModelId;
      return `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;
    },
    buildModelId: (endpoint, config) => {
      // Handle cross-region access
      if (config.crossRegion && config.region) {
        // Extract base model ID without region prefix
        const baseModelId = endpoint.providerModelId.replace(/^[a-z]{2}\./, "");
        const regionPrefix = config.region.split("-")[0];
        return `${regionPrefix}.${baseModelId}`;
      }
      return endpoint.providerModelId;
    },
    authenticate: async (context) => {
      if (!context.apiKey || !context.secretKey) {
        throw new Error("Bedrock requires both apiKey and secretKey");
      }
      
      if (!context.requestMethod || !context.requestUrl || !context.requestBody) {
        throw new Error("Bedrock authentication requires requestMethod, requestUrl, and requestBody");
      }

      const awsRegion = context.config.region || "us-west-1";
      const sigv4 = new SignatureV4({
        service: "bedrock",
        region: awsRegion,
        credentials: {
          accessKeyId: context.apiKey,
          secretAccessKey: context.secretKey,
        },
        sha256: Sha256,
      });

      const headers = new Headers();
      const forwardToHost = `bedrock-runtime.${awsRegion}.amazonaws.com`;
      
      // Required headers for AWS requests
      headers.set("host", forwardToHost);
      headers.set("content-type", "application/json");

      const url = new URL(context.requestUrl);
      const request = new HttpRequest({
        method: context.requestMethod,
        protocol: url.protocol,
        hostname: forwardToHost,
        path: url.pathname + url.search,
        headers: Object.fromEntries(headers.entries()),
        body: context.requestBody,
      });

      const signedRequest = await sigv4.sign(request);

      // Convert signed headers to record
      const signedHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(signedRequest.headers)) {
        if (value) {
          signedHeaders[key] = value.toString();
        }
      }

      return { headers: signedHeaders };
    },
    pricingPages: ["https://aws.amazon.com/bedrock/pricing/"],
    modelPages: [
      "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
    ],
  },

  vertex: {
    id: "vertex",
    baseUrl: "https://{region}-aiplatform.googleapis.com",
    auth: "oauth",
    requiredConfig: ["projectId", "region"],
    buildModelId: (endpoint) => endpoint.providerModelId || "",
    buildUrl: (endpoint, options) => {
      const { projectId, region } = options || {};
      const modelId = endpoint.providerModelId || "";
      const baseUrl = "https://{region}-aiplatform.googleapis.com";
      const baseUrlWithRegion = baseUrl.replace("{region}", region || "");
      return `${baseUrlWithRegion}/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models/${modelId}:streamRawPredict`;
    },
    authenticate: (context) => {
      // Vertex AI uses OAuth access tokens
      return {
        headers: {
          Authorization: `Bearer ${context.apiKey || ""}`,
        },
      };
    },
    pricingPages: [
      "https://cloud.google.com/vertex-ai/generative-ai/pricing",
      "https://ai.google.dev/pricing",
    ],
    modelPages: [
      "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models",
    ],
  },

  "azure-openai": {
    id: "azure-openai",
    baseUrl: "https://{resourceName}.openai.azure.com",
    auth: "api-key",
    requiredConfig: ["resourceName", "deploymentName"],
    buildUrl: (endpoint, config) => {
      const { resourceName, deploymentName } = config;
      if (!resourceName || !deploymentName) {
        throw new Error(
          "Azure OpenAI requires resourceName and deploymentName"
        );
      }
      const apiVersion = "2024-02-15-preview";
      return `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    },
    buildModelId: (endpoint) => endpoint.providerModelId,
    authenticate: (context) => {
      return {
        headers: {
          "api-key": context.apiKey || "",
        },
      };
    },
    pricingPages: [
      "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/",
    ],
    modelPages: [
      "https://learn.microsoft.com/azure/ai-services/openai/concepts/models",
    ],
  },

  perplexity: {
    id: "perplexity",
    baseUrl: "https://api.perplexity.ai",
    auth: "api-key",
    buildUrl: () => "https://api.perplexity.ai/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
    authenticate: (context) => {
      return {
        headers: {
          Authorization: `Bearer ${context.apiKey || ""}`,
        },
      };
    },
    pricingPages: ["https://docs.perplexity.ai/guides/pricing"],
    modelPages: ["https://docs.perplexity.ai/guides/models"],
  },

  groq: {
    id: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    auth: "api-key",
    buildUrl: () => "https://api.groq.com/openai/v1/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
    authenticate: (context) => {
      return {
        headers: {
          Authorization: `Bearer ${context.apiKey || ""}`,
        },
      };
    },
    pricingPages: [
      "https://console.groq.com/pricing",
      "https://groq.com/pricing/",
    ],
    modelPages: ["https://console.groq.com/docs/models"],
  },

  deepseek: {
    id: "deepseek",
    baseUrl: "https://api.deepseek.com",
    auth: "api-key",
    buildUrl: () => "https://api.deepseek.com/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
    authenticate: (context) => {
      return {
        headers: {
          Authorization: `Bearer ${context.apiKey || ""}`,
        },
      };
    },
    pricingPages: ["https://api-docs.deepseek.com/"],
    modelPages: ["https://api-docs.deepseek.com/"],
  },

  cohere: {
    id: "cohere",
    baseUrl: "https://api.cohere.ai",
    auth: "api-key",
    buildUrl: () => "https://api.cohere.ai/v1/chat",
    buildModelId: (endpoint) => endpoint.providerModelId,
    authenticate: (context) => {
      return {
        headers: {
          Authorization: `Bearer ${context.apiKey || ""}`,
        },
      };
    },
    pricingPages: ["https://cohere.com/pricing"],
    modelPages: ["https://docs.cohere.com/docs/models"],
  },

  xai: {
    id: "xai",
    baseUrl: "https://api.x.ai",
    auth: "api-key",
    buildUrl: () => "https://api.x.ai/v1/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
    authenticate: (context) => {
      return {
        headers: {
          Authorization: `Bearer ${context.apiKey || ""}`,
        },
      };
    },
    pricingPages: ["https://docs.x.ai/docs/pricing"],
    modelPages: ["https://docs.x.ai/docs/models"],
  },
} satisfies Record<ProviderName, ProviderConfig>;

// Re-export ProviderName type for convenience
export type { ProviderName } from "./types";

// Helper function to get provider config
export function getProvider(providerName: string): Result<ProviderConfig> {
  const provider =
    providerName in providers
      ? providers[providerName as ProviderName]
      : undefined;

  return provider ? ok(provider) : err(`Unknown provider: ${providerName}`);
}

// TODO: Remove once we normalize provider names in provider_keys table.
export const dbProviderToProvider = (provider: string): ProviderName | null => {
  if (provider === "openai" || provider === "OpenAI") {
    return "openai";
  }
  if (provider === "Anthropic") {
    return "anthropic";
  }
  if (provider === "AWS Bedrock") {
    return "bedrock";
  }
  if (provider === "Vertex AI") {
    return "vertex";
  }
  return null;
};

export const providerToDbProvider = (provider: ProviderName): string => {
  if (provider === "openai") {
    return "OpenAI";
  }
  if (provider === "anthropic") {
    return "Anthropic";
  }
  if (provider === "bedrock") {
    return "AWS Bedrock";
  }
  if (provider === "vertex") {
    return "Vertex AI";
  }
  return provider;
};

// Helper function to build URL for an endpoint
export function buildEndpointUrl(
  endpoint: Endpoint,
  userConfig: UserConfig = {}
): Result<string> {
  const providerResult = getProvider(endpoint.provider);
  if (providerResult.error) {
    return err(providerResult.error);
  }

  const provider = providerResult.data;
  if (!provider) {
    return err(`Provider data is null for: ${endpoint.provider}`);
  }

  try {
    // Merge endpoint region with user config
    const config: UserConfig = {
      ...userConfig,
      region: userConfig.region || endpoint.region,
    };

    const url = provider.buildUrl(endpoint, config);
    return ok(url);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to build URL");
  }
}

// Helper function to build model ID for an endpoint
export function buildModelId(
  endpoint: Endpoint,
  userConfig: UserConfig = {}
): Result<string> {
  const providerResult = getProvider(endpoint.provider);
  if (providerResult.error) {
    return err(providerResult.error);
  }

  const provider = providerResult.data;
  if (!provider) {
    return err(`Provider data is null for: ${endpoint.provider}`);
  }

  if (!provider.buildModelId) {
    return ok(endpoint.providerModelId);
  }

  try {
    // Merge endpoint region with user config
    const config: UserConfig = {
      ...userConfig,
      region: userConfig.region || endpoint.region,
    };

    const modelId = provider.buildModelId(endpoint, config);
    return ok(modelId);
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "Failed to build model ID"
    );
  }
}

// Helper function to authenticate requests for an endpoint
export async function authenticateRequest(
  endpoint: Endpoint,
  context: Omit<AuthContext, "endpoint">
): Promise<Result<AuthResult>> {
  const providerResult = getProvider(endpoint.provider);
  if (providerResult.error) {
    return err(providerResult.error);
  }

  const provider = providerResult.data;
  if (!provider) {
    return err(`Provider data is null for: ${endpoint.provider}`);
  }

  if (!provider.authenticate) {
    // Default authentication for providers without custom auth
    return ok({
      headers: {
        Authorization: `Bearer ${context.apiKey || ""}`,
      },
    });
  }

  try {
    const authContext: AuthContext = {
      ...context,
      endpoint,
    };
    const result = await provider.authenticate(authContext);
    return ok(result);
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "Failed to authenticate request"
    );
  }
}
