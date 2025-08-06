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
  regions?: string[];
  apiVersion?: string;
  endpoints: Record<string, ProviderEndpoint | string>;
}
export const providers = {
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    auth: "api-key",
    endpoints: {
      chat: "/v1/messages",
      complete: "/v1/complete",
    },
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
  },
  vertex: {
    name: "Google Vertex AI",
    baseUrl: "https://aiplatform.googleapis.com",
    auth: "oauth",
    requiresProjectId: true,
    requiresRegion: true,
    endpoints: {},
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

export function getProvider(providerId: string): ProviderConfig | undefined {
  return providers[providerId as keyof typeof providers] as
    | ProviderConfig
    | undefined;
}

export function buildEndpointUrl(
  providerId: string,
  endpointType: string,
  params?: Record<string, string>
): string | null {
  const provider = providers[providerId as keyof typeof providers] as
    | ProviderConfig
    | undefined;
  if (!provider) return null;

  const endpoint = provider.endpoints[endpointType];
  if (!endpoint) return null;

  const endpointPath = typeof endpoint === "string" ? endpoint : endpoint.path;

  let url = provider.baseUrl + endpointPath;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });
  }

  return url;
}

export function isDetailedEndpoint(
  endpoint: ProviderEndpoint | string
): endpoint is ProviderEndpoint {
  return typeof endpoint === "object" && "path" in endpoint;
}

export function buildBedrockModelId(
  endpoint: {
    providerModelId?: string;
    baseModelId?: string;
    supportsDynamicRegion?: boolean;
  },
  options?: {
    region?: string;
    crossRegion?: boolean;
  }
): string {
  // If not dynamic region or no BYOK options, return the managed model ID
  if (
    !endpoint.supportsDynamicRegion ||
    !options?.region ||
    !endpoint.baseModelId
  ) {
    return endpoint.providerModelId || "";
  }

  // For BYOK with cross-region enabled
  if (options.crossRegion) {
    // Extract the region prefix (e.g., "us" from "us-east-1")
    const regionPrefix = options.region.split("-")[0];
    return `${regionPrefix}.${endpoint.baseModelId}`;
  }

  // For BYOK without cross-region
  return endpoint.baseModelId;
}

export default providers;
