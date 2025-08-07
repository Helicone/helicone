import type { ModelEndpoint } from "./types";

export interface ProviderEndpoint {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  description?: string;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  auth: "api-key" | "oauth" | "aws-signature" | "azure-ad";
  requiresProjectId?: boolean;
  requiresRegion?: boolean;
  requiresDeploymentName?: boolean;
  regions?: readonly string[];
  apiVersion?: string;
  endpoints: Readonly<Record<string, ProviderEndpoint | string>>;
  buildModelId?: (endpoint: ModelEndpoint, options?: any) => string;
  buildUrl?: (
    baseUrl: string,
    endpoint: ModelEndpoint,
    options?: any
  ) => string;
}

// Define provider names type from the actual providers object
export type ProviderName = keyof typeof providers;
export const providers = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com",
    auth: "api-key",
    endpoints: {},
    buildModelId: (endpoint) => endpoint.providerModelId || "",
    buildUrl: (baseUrl) => `${baseUrl}/v1/chat/completions`,
  },
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    auth: "api-key",
    endpoints: {
      chat: "/v1/messages",
      complete: "/v1/complete",
    },
    buildModelId: (endpoint) => endpoint.providerModelId || "",
    buildUrl: (baseUrl) => `${baseUrl}/v1/messages`,
  },
  bedrock: {
    name: "Amazon Bedrock",
    baseUrl: "https://bedrock-runtime.{region}.amazonaws.com",
    auth: "aws-signature",
    requiresRegion: true,
    regions: [
      "us-east-1",
      "us-east-2",
      "us-west-1",
      "us-west-2",
      "ap-south-1",
      "ap-northeast-1",
      "ap-northeast-2",
      "ap-southeast-1",
      "ap-southeast-2",
      "ca-central-1",
      "eu-central-1",
      "eu-west-1",
      "eu-west-2",
      "eu-west-3",
      "sa-east-1",
    ],
    endpoints: {},
    buildModelId: (endpoint, options) => {
      // Handle dynamic region for BYOK
      if (
        endpoint.supportsDynamicRegion &&
        options?.region &&
        endpoint.baseModelId
      ) {
        if (options.crossRegion) {
          const regionPrefix = options.region.split("-")[0];
          return `${regionPrefix}.${endpoint.baseModelId}`;
        }
        return endpoint.baseModelId;
      }
      return endpoint.providerModelId || "";
    },
    buildUrl: (baseUrl, endpoint, options) => {
      const url = options?.region
        ? baseUrl.replace("{region}", options.region)
        : baseUrl;
      // Inline the model ID logic to avoid circular reference
      let modelId: string;
      if (
        endpoint.supportsDynamicRegion &&
        options?.region &&
        endpoint.baseModelId
      ) {
        if (options.crossRegion) {
          const regionPrefix = options.region.split("-")[0];
          modelId = `${regionPrefix}.${endpoint.baseModelId}`;
        } else {
          modelId = endpoint.baseModelId;
        }
      } else {
        modelId = endpoint.providerModelId || "";
      }
      return `${url}/model/${modelId}/invoke`;
    },
  },
  vertex: {
    name: "Google Vertex AI",
    baseUrl: "https://aiplatform.googleapis.com",
    auth: "oauth",
    requiresProjectId: true,
    requiresRegion: true,
    endpoints: {},
    buildModelId: (endpoint) => endpoint.providerModelId || "",
    buildUrl: (baseUrl, endpoint, options) => {
      const { projectId, region } = options || {};
      const modelId = endpoint.providerModelId || "";
      return `${baseUrl}/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models/${modelId}:streamRawPredict`;
    },
  },
  // openai: {
  //   name: "OpenAI",
  //   baseUrl: "https://api.openai.com",
  //   auth: "api-key",
  //   endpoints: {
  //     chat: "/v1/chat/completions",
  //     completions: "/v1/completions",
  //     embeddings: "/v1/embeddings",
  //   },
  // },
  // "vertex-regional": {
  //   name: "Google Vertex AI (Regional)",
  //   baseUrl: "https://{region}-aiplatform.googleapis.com",
  //   auth: "oauth",
  //   requiresProjectId: true,
  //   requiresRegion: true,
  //   endpoints: {
  //     anthropic: {
  //       path: "/v1/projects/{projectId}/locations/{region}/publishers/anthropic/models/{model}:streamRawPredict",
  //       description: "Anthropic models with regional endpoint",
  //     },
  //     google: {
  //       path: "/v1/projects/{projectId}/locations/{region}/publishers/google/models/{model}:generateContent",
  //       description: "Google models with regional endpoint",
  //     },
  //   },
  // },

  // "azure-openai": {
  //   name: "Azure OpenAI",
  //   baseUrl: "https://{resourceName}.openai.azure.com",
  //   auth: "api-key",
  //   requiresDeploymentName: true,
  //   apiVersion: "2024-02-15-preview",
  //   endpoints: {
  //     chat: "/openai/deployments/{deploymentName}/chat/completions?api-version={apiVersion}",
  //     completions:
  //       "/openai/deployments/{deploymentName}/completions?api-version={apiVersion}",
  //     embeddings:
  //       "/openai/deployments/{deploymentName}/embeddings?api-version={apiVersion}",
  //   },
  // },

  // openrouter: {
  //   name: "OpenRouter",
  //   baseUrl: "https://openrouter.ai",
  //   auth: "api-key",
  //   endpoints: {
  //     chat: "/api/v1/chat/completions",
  //   },
  // },

  // together: {
  //   name: "Together AI",
  //   baseUrl: "https://api.together.xyz",
  //   auth: "api-key",
  //   endpoints: {
  //     chat: "/v1/chat/completions",
  //     completions: "/v1/completions",
  //     images: "/v1/images/generations",
  //   },
  // },

  // groq: {
  //   name: "Groq",
  //   baseUrl: "https://api.groq.com",
  //   auth: "api-key",
  //   endpoints: {
  //     chat: "/openai/v1/chat/completions",
  //   },
  // },

  // perplexity: {
  //   name: "Perplexity",
  //   baseUrl: "https://api.perplexity.ai",
  //   auth: "api-key",
  //   endpoints: {
  //     chat: "/chat/completions",
  //   },
  // },

  // cohere: {
  //   name: "Cohere",
  //   baseUrl: "https://api.cohere.ai",
  //   auth: "api-key",
  //   endpoints: {
  //     chat: "/v1/chat",
  //     generate: "/v1/generate",
  //     embed: "/v1/embed",
  //     rerank: "/v1/rerank",
  //   },
  // },

  // mistral: {
  //   name: "Mistral AI",
  //   baseUrl: "https://api.mistral.ai",
  //   auth: "api-key",
  //   endpoints: {
  //     chat: "/v1/chat/completions",
  //     embeddings: "/v1/embeddings",
  //     fim: "/v1/fim/completions",
  //   },
  // },

  // deepseek: {
  //   name: "DeepSeek",
  //   baseUrl: "https://api.deepseek.com",
  //   auth: "api-key",
  //   endpoints: {
  //     chat: "/chat/completions",
  //     betaChat: "/beta/chat/completions",
  //   },
  // },

  // fireworks: {
  //   name: "Fireworks AI",
  //   baseUrl: "https://api.fireworks.ai",
  //   auth: "api-key",
  //   endpoints: {
  //     chat: "/inference/v1/chat/completions",
  //     completions: "/inference/v1/completions",
  //   },
  // },

  // replicate: {
  //   name: "Replicate",
  //   baseUrl: "https://api.replicate.com",
  //   auth: "api-key",
  //   endpoints: {
  //     predictions: "/v1/predictions",
  //     models: "/v1/models/{owner}/{name}/predictions",
  //   },
  // },
} as const satisfies Record<string, ProviderConfig>;

export default providers;
