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
  const config = providerConfigs[provider];
  const finalEndpoint = providerSettings?.endpoint || config.defaultEndpoint;

  // Replace any placeholders in the endpoint
  let processedEndpoint = finalEndpoint;
  if (modelString) {
    processedEndpoint = processedEndpoint.replace(
      /{modelString}/g,
      modelString
    );
  }

  // Process the baseUrl to replace any lowercase templates
  let processedBaseUrl = config.baseUrl;

  // For lowercase templates like {modelString} in baseUrl, replace with modelId
  if (modelString) {
    processedBaseUrl = processedBaseUrl.replace(/{modelString}/g, modelString);
  }

  // Replace ALLCAPS templates with provided values
  if (providerSettings?.region) {
    processedBaseUrl = processedBaseUrl.replace(
      /{REGION}/g,
      providerSettings.region
    );
    processedEndpoint = processedEndpoint.replace(
      /{REGION}/g,
      providerSettings.region
    );
  }

  if (providerSettings?.project) {
    processedBaseUrl = processedBaseUrl.replace(
      /{PROJECT}/g,
      providerSettings.project
    );
    processedEndpoint = processedEndpoint.replace(
      /{PROJECT}/g,
      providerSettings.project
    );
  }

  if (providerSettings?.location) {
    processedBaseUrl = processedBaseUrl.replace(
      /{LOCATION}/g,
      providerSettings.location
    );
    processedEndpoint = processedEndpoint.replace(
      /{LOCATION}/g,
      providerSettings.location
    );
  }

  if (providerSettings?.endpoint) {
    processedBaseUrl = processedBaseUrl.replace(
      /{ENDPOINT}/g,
      providerSettings.endpoint
    );
  }

  if (providerSettings?.deployment) {
    processedBaseUrl = processedBaseUrl.replace(
      /{DEPLOYMENT}/g,
      providerSettings.deployment
    );
    processedEndpoint = processedEndpoint.replace(
      /{DEPLOYMENT}/g,
      providerSettings.deployment
    );
  }

  // Final check to ensure all placeholders are replaced
  // This is a safety measure to catch any remaining placeholders
  const finalUrl = `${processedBaseUrl}${processedEndpoint}`;

  // If there are still placeholders, log a warning
  if (finalUrl.includes("{") && finalUrl.includes("}")) {
    console.warn(`Warning: URL still contains placeholders: ${finalUrl}`);
  }

  return finalUrl;
}
