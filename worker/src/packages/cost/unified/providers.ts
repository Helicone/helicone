import { Provider, ProviderConfig } from "./types";

// Provider configurations with default settings
export const providerConfigs: Record<Provider, ProviderConfig> = {
  OPENAI: {
    baseUrl: "https://api.openai.com",
    authHeaderConfig: {
      headerName: "Authorization",
      valuePrefix: "Bearer ",
    },
    defaultMapper: "openai-chat",
    defaultEndpoint: "/v1/chat/completions",
  },
  AZURE: {
    baseUrl: "https://{ENDPOINT}/openai/deployments/{DEPLOYMENT}",
    authHeaderConfig: {
      headerName: "api-key",
    },
    defaultMapper: "openai-chat",
    defaultEndpoint: "/chat/completions?api-version=2024-10-21", // KEEP UP TO DATE
  },
  ANTHROPIC: {
    baseUrl: "https://api.anthropic.com",
    authHeaderConfig: {
      headerName: "x-api-key",
    },
    defaultHeaders: {
      "anthropic-version": "2023-06-01", // KEEP UP TO DATE
    },
    defaultMapper: "anthropic-chat",
    defaultEndpoint: "/v1/messages",
  },
  BEDROCK: {
    baseUrl: "https://bedrock-runtime.{REGION}.amazonaws.com",
    authHeaderConfig: {
      headerName: "Authorization",
    },
    defaultMapper: "anthropic-chat",
    defaultEndpoint: "/model/{model}/invoke",
  },
  GOOGLE_GEMINI: {
    baseUrl: "https://generativelanguage.googleapis.com",
    authHeaderConfig: {
      headerName: "x-goog-api-key",
    },
    defaultMapper: "gemini-chat",
    defaultEndpoint: "/v1beta/models/{model}",
  },
  GOOGLE_VERTEXAI: {
    baseUrl: "https://{REGION}-aiplatform.googleapis.com",
    authHeaderConfig: {
      headerName: "Authorization",
      valuePrefix: "Bearer ",
    },
    defaultMapper: "gemini-chat",
    defaultEndpoint:
      "/v1/projects/{PROJECT}/locations/{LOCATION}/publishers/google/models/{model}:generateContent",
  },
  OPENROUTER: {
    baseUrl: "https://api.openrouter.ai",
    authHeaderConfig: {
      headerName: "Authorization",
      valuePrefix: "Bearer ",
    },
    defaultMapper: "openai-chat",
    defaultEndpoint: "/api/v1/chat/completions",
  },
};

// Helper function to get a provider's configuration
export function getProviderConfig(provider: Provider): ProviderConfig {
  return providerConfigs[provider];
}

// Helper function to build a full URL for a provider
export function buildProviderUrl(
  provider: Provider,
  endpoint?: string,
  modelId?: string
): string {
  const config = providerConfigs[provider];
  const finalEndpoint = endpoint || config.defaultEndpoint;

  // Replace any placeholders in the endpoint
  let processedEndpoint = finalEndpoint;
  if (modelId) {
    processedEndpoint = processedEndpoint
      .replace("{model}", modelId)
      .replace("{modelId}", modelId);
  }

  return `${config.baseUrl}${processedEndpoint}`;
}
