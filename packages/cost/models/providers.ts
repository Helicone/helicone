/**
 * Provider configurations for URL and model ID building
 */

import type {
  ProviderConfig,
  Endpoint,
  UserConfig,
  ProviderName,
} from "./types";

export const providers = {
  anthropic: {
    id: "anthropic",
    baseUrl: "https://api.anthropic.com",
    auth: "api-key",
    buildUrl: () => "https://api.anthropic.com/v1/messages",
    buildModelId: (endpoint) => endpoint.providerModelId,
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
    pricingPages: ["https://aws.amazon.com/bedrock/pricing/"],
    modelPages: [
      "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
    ],
  },

  vertex: {
    id: "vertex",
    baseUrl: "https://aiplatform.googleapis.com",
    auth: "oauth",
    requiredConfig: ["projectId", "region"],
    buildUrl: (endpoint, config) => {
      const { projectId, region } = config;
      if (!projectId || !region) {
        throw new Error("Vertex AI requires projectId and region");
      }
      const modelId = endpoint.providerModelId;
      return `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models/${modelId}:streamRawPredict`;
    },
    buildModelId: (endpoint) => endpoint.providerModelId,
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
    pricingPages: ["https://docs.perplexity.ai/guides/pricing"],
    modelPages: ["https://docs.perplexity.ai/guides/models"],
  },

  groq: {
    id: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    auth: "api-key",
    buildUrl: () => "https://api.groq.com/openai/v1/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
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
    pricingPages: ["https://api-docs.deepseek.com/"],
    modelPages: ["https://api-docs.deepseek.com/"],
  },

  cohere: {
    id: "cohere",
    baseUrl: "https://api.cohere.ai",
    auth: "api-key",
    buildUrl: () => "https://api.cohere.ai/v1/chat",
    buildModelId: (endpoint) => endpoint.providerModelId,
    pricingPages: ["https://cohere.com/pricing"],
    modelPages: ["https://docs.cohere.com/docs/models"],
  },

  xai: {
    id: "xai",
    baseUrl: "https://api.x.ai",
    auth: "api-key",
    buildUrl: () => "https://api.x.ai/v1/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
    pricingPages: ["https://docs.x.ai/docs/pricing"],
    modelPages: ["https://docs.x.ai/docs/models"],
  },
} satisfies Record<ProviderName, ProviderConfig>;

// Helper function to get provider config
export function getProvider(
  providerName: ProviderName
): ProviderConfig | undefined {
  return providers[providerName];
}

// Helper function to build URL for an endpoint
export function buildEndpointUrl(
  endpoint: Endpoint,
  userConfig: UserConfig = {}
): string {
  const provider = getProvider(endpoint.provider);
  if (!provider) {
    throw new Error(`Unknown provider: ${endpoint.provider}`);
  }

  // Merge endpoint region with user config
  const config: UserConfig = {
    ...userConfig,
    region: userConfig.region || endpoint.region,
  };

  return provider.buildUrl(endpoint, config);
}

// Helper function to build model ID for an endpoint
export function buildModelId(
  endpoint: Endpoint,
  userConfig: UserConfig = {}
): string {
  const provider = getProvider(endpoint.provider);
  if (!provider) {
    throw new Error(`Unknown provider: ${endpoint.provider}`);
  }

  if (!provider.buildModelId) {
    return endpoint.providerModelId;
  }

  // Merge endpoint region with user config
  const config: UserConfig = {
    ...userConfig,
    region: userConfig.region || endpoint.region,
  };

  return provider.buildModelId(endpoint, config);
}
