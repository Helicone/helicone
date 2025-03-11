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
    defaultEndpoint: "/model/{modelString}/invoke",
  },
  GOOGLE_GEMINI: {
    baseUrl: "https://generativelanguage.googleapis.com",
    authHeaderConfig: {
      headerName: "x-goog-api-key",
    },
    defaultMapper: "gemini-chat",
    defaultEndpoint: "/v1beta/models/{modelString}:generateContent",
  },
  GOOGLE_VERTEXAI: {
    baseUrl: "https://{REGION}-aiplatform.googleapis.com",
    authHeaderConfig: {
      headerName: "Authorization",
      valuePrefix: "Bearer ",
    },
    defaultMapper: "gemini-chat",
    defaultEndpoint:
      "/v1/projects/{PROJECT}/locations/{LOCATION}/publishers/google/models/{modelString}:generateContent",
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
  modelString?: string,
  providerSettings?: {
    region?: string;
    project?: string;
    location?: string;
    endpoint?: string;
    deployment?: string;
  }
): string {
  const config = getProviderConfig(provider);
  const finalEndpoint = providerSettings?.endpoint || config.defaultEndpoint;

  // Define all possible replacements in a structured way
  const replacements = [
    { placeholder: /{modelString}/g, value: modelString },
    { placeholder: /{REGION}/g, value: providerSettings?.region },
    { placeholder: /{PROJECT}/g, value: providerSettings?.project },
    { placeholder: /{LOCATION}/g, value: providerSettings?.location },
    { placeholder: /{ENDPOINT}/g, value: providerSettings?.endpoint },
    { placeholder: /{DEPLOYMENT}/g, value: providerSettings?.deployment },
  ];

  // Apply replacements to baseUrl
  const processedBaseUrl = replacements.reduce(
    (url, { placeholder, value }) =>
      value ? url.replace(placeholder, value) : url,
    config.baseUrl
  );

  // Apply replacements to endpoint
  const processedEndpoint = replacements.reduce(
    (endpoint, { placeholder, value }) =>
      value ? endpoint.replace(placeholder, value) : endpoint,
    finalEndpoint
  );

  // Final URL
  const finalUrl = `${processedBaseUrl}${processedEndpoint}`;

  // Safety check for any remaining placeholders
  if (finalUrl.includes("{") && finalUrl.includes("}")) {
    console.warn(`Warning: URL still contains placeholders: ${finalUrl}`);
  }

  return finalUrl;
}
