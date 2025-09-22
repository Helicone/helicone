import { err, ok, Result } from "../../common/result";
import type {
  Endpoint,
  ModelProviderConfig,
  UserEndpointConfig,
  AuthContext,
  AuthResult,
  RequestBodyContext,
  RequestParams,
} from "./types";
import { providers, ModelProviderName } from "./providers";
import { BaseProvider } from "./providers/base";
import { Provider } from "@helicone-package/llm-mapper/types";
import { CacheProvider } from "../../common/cache/provider";

export function heliconeProviderToModelProviderName(
  provider: Provider
): ModelProviderName | null {
  if (provider === "CUSTOM") {
    return null;
  }

  switch (provider) {
    case "OPENAI":
      return "openai";
    case "ANTHROPIC":
      return "anthropic";
    case "GOOGLE":
      return "google-ai-studio";
    case "GROQ":
      return "groq";
    case "X":
      return "xai";
    case "AZURE":
      return "azure";
    case "AWS":
    case "BEDROCK":
      return "bedrock";
    case "PERPLEXITY":
      return "perplexity";
    case "DEEPSEEK":
      return "deepseek";
    case "COHERE":
      return "cohere";
    case "OPENROUTER":
      return "openrouter";
    // new registry does not have
    case "LOCAL":
    case "HELICONE":
    case "AMDBARTEK":
    case "ANYSCALE":
    case "CLOUDFLARE":
    case "2YFV":
    case "TOGETHER":
    case "LEMONFOX":
    case "FIREWORKS":
    case "WISDOMINANUTSHELL":
    case "MISTRAL":
    case "DEEPINFRA":
    case "QSTASH":
    case "FIRECRAWL":
    case "AVIAN":
    case "NEBIUS":
    case "NOVITA":
    case "OPENPIPE":
    case "CHUTES":
    case "LLAMA":
    case "NVIDIA":
    case "VERCEL":
      return null;
    default:
      return null;
  }
}

// Helper function to get provider instance
export function getProvider(providerName: string): Result<BaseProvider> {
  const provider =
    providerName in providers
      ? providers[providerName as ModelProviderName]
      : undefined;

  return provider ? ok(provider) : err(`Unknown provider: ${providerName}`);
}

export function getProviderDisplayName(providerName: string): string {
  const provider = providers[providerName as ModelProviderName];
  return provider?.displayName || providerName;
}

// TODO: Remove once we normalize provider names in provider_keys table.
export const dbProviderToProvider = (
  provider: string
): ModelProviderName | null => {
  if (provider === "openai" || provider === "OpenAI") {
    return "openai";
  }
  if (provider === "anthropic" || provider === "Anthropic") {
    return "anthropic";
  }
  if (
    provider === "bedrock" ||
    provider === "AWS Bedrock" ||
    provider === "aws"
  ) {
    return "bedrock";
  }
  if (provider === "vertex" || provider === "Vertex AI") {
    return "vertex";
  }
  if (provider === "groq" || provider === "Groq") {
    return "groq";
  }
  if (provider === "google" || provider === "Google AI (Gemini)") {
    return "google-ai-studio";
  }
  if (provider === "Azure OpenAI") {
    return "azure";
  }
  if (provider === "deepseek" || provider === "DeepSeek") {
    return "deepseek";
  }
  if (provider === "openrouter" || provider === "OpenRouter") {
    return "openrouter";
  }
  return null;
};

export function buildEndpointUrl(
  endpoint: Endpoint,
  requestParams: RequestParams
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
    const url = provider.buildUrl(
      endpoint.modelConfig,
      endpoint.userConfig,
      requestParams
    );
    return ok(url);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to build URL");
  }
}

// Helper function to build model ID for an endpoint
export function buildModelId(
  endpointConfig: ModelProviderConfig,
  userConfig: UserEndpointConfig = {}
): Result<string> {
  const providerResult = getProvider(endpointConfig.provider);
  if (providerResult.error) {
    return err(providerResult.error);
  }

  const provider = providerResult.data;
  if (!provider) {
    return err(`Provider data is null for: ${endpointConfig.provider}`);
  }

  if (!provider.buildModelId) {
    return ok(endpointConfig.providerModelId);
  }

  try {
    // Merge endpoint deployment/region with user config
    const config: UserEndpointConfig = {
      ...userConfig,
      region: userConfig?.region || "",
    };

    const modelId = provider.buildModelId(endpointConfig, config);
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
  authContext: AuthContext,
  cacheProvider?: CacheProvider
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
        Authorization: `Bearer ${authContext.apiKey || ""}`,
      },
    });
  }

  try {
    const result = await provider.authenticate(
      authContext,
      endpoint,
      cacheProvider
    );
    return ok(result);
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "Failed to authenticate request"
    );
  }
}

export async function buildRequestBody(
  endpoint: Endpoint,
  context: RequestBodyContext
): Promise<Result<string>> {
  const providerResult = getProvider(endpoint.provider);
  if (providerResult.error) {
    return err(providerResult.error);
  }

  const provider = providerResult.data;
  if (!provider) {
    return err(`Provider data is null for: ${endpoint.provider}`);
  }

  if (!provider.buildRequestBody) {
    return ok(
      JSON.stringify({
        ...context.parsedBody,
        model: endpoint.providerModelId,
      })
    );
  }

  try {
    const result = await provider.buildRequestBody(endpoint, context);
    return ok(result);
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "Failed to build request body"
    );
  }
}

export async function buildErrorMessage(
  endpoint: Endpoint,
  response: Response
): Promise<Result<string>> {
  const providerResult = getProvider(endpoint.provider);
  if (providerResult.error) {
    return err(providerResult.error);
  }

  const provider = providerResult.data;
  if (!provider) {
    return err(`Provider data is null for: ${endpoint.provider}`);
  }

  return ok(await provider.buildErrorMessage(response));
}
