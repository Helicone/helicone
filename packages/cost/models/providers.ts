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
  },

  openai: {
    id: "openai",
    baseUrl: "https://api.openai.com",
    auth: "api-key",
    buildUrl: () => "https://api.openai.com/v1/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
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
  },

  perplexity: {
    id: "perplexity",
    baseUrl: "https://api.perplexity.ai",
    auth: "api-key",
    buildUrl: () => "https://api.perplexity.ai/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
  },

  xai: {
    id: "xai",
    baseUrl: "https://api.x.ai",
    auth: "api-key",
    buildUrl: () => "https://api.x.ai/v1/chat/completions",
    buildModelId: (endpoint) => endpoint.providerModelId,
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
