import { err, ok, Result } from "../../common/result";
import type {
  Endpoint,
  ModelProviderConfig,
  UserEndpointConfig,
  AuthContext,
  AuthResult,
  RequestBodyContext,
  RequestParams,
  ResponseFormat,
  ModelSpec,
} from "./types";
import { providers, ModelProviderName } from "./providers";
import { BaseProvider } from "./providers/base";
import { Provider } from "@helicone-package/llm-mapper/types";
import { CacheProvider } from "../../common/cache/provider";
import { registry } from "./registry";

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
    case "DEEPINFRA":
      return "deepinfra";
    case "MISTRAL":
      return "mistral";
    case "NOVITA":
      return "novita";
    case "NEBIUS":
      return "nebius";
    case "CHUTES":
      return "chutes";
    case "CEREBRAS":
      return "cerebras";
    case "BASETEN":
      return "baseten";
    case "FIREWORKS":
      return "fireworks";
    // new registry does not have
    case "LOCAL":
    case "HELICONE":
    case "AMDBARTEK":
    case "ANYSCALE":
    case "CLOUDFLARE":
    case "2YFV":
    case "TOGETHER":
    case "LEMONFOX":
    case "WISDOMINANUTSHELL":
    case "QSTASH":
    case "FIRECRAWL":
    case "AVIAN":
    case "OPENPIPE":
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
  if (provider === "novita" || provider === "Novita") {
    return "novita";
  }
  if (provider === "deepinfra" || provider === "DeepInfra") {
    return "deepinfra";
  }
  if (provider === "fireworks" || provider === "Fireworks") {
    return "fireworks";
  }
  if (provider === "baseten" || provider === "Baseten") {
    return "baseten";
  }
  if (provider === "cerebras" || provider === "Cerebras") {
    return "cerebras";
  }
  if (provider === "chutes" || provider === "Chutes") {
    return "chutes";
  }
  if (provider === "nebius" || provider === "Nebius") {
    return "nebius";
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
    const url = provider.buildUrl(endpoint, requestParams);
    return ok(url);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to build URL");
  }
}

// Helper function to build model ID for an endpoint
export function buildModelId(
  modelProviderConfig: ModelProviderConfig,
  userConfig: UserEndpointConfig = {}
): Result<string> {
  const providerResult = getProvider(modelProviderConfig.provider);
  if (providerResult.error) {
    return err(providerResult.error);
  }

  const provider = providerResult.data;
  if (!provider) {
    return err(`Provider data is null for: ${modelProviderConfig.provider}`);
  }

  if (!provider.buildModelId) {
    return ok(modelProviderConfig.providerModelId);
  }

  try {
    const modelId = provider.buildModelId(modelProviderConfig, userConfig);
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

export function filterUnsupportedParameters(
  parsedBody: any,
  endpoint: Endpoint
): any {
  // If no unsupported parameters defined, return original
  if (!endpoint.modelConfig.unsupportedParameters?.length) {
    return parsedBody;
  }

  // Create a shallow copy to avoid mutating the original
  const filtered = { ...parsedBody };

  // Remove each unsupported parameter
  for (const param of endpoint.modelConfig.unsupportedParameters) {
    delete filtered[param];
  }

  return filtered;
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

  // Filter out unsupported parameters before provider builds the body
  const filteredBody = filterUnsupportedParameters(
    context.parsedBody,
    endpoint
  );

  const filteredContext = { ...context, parsedBody: filteredBody };

  if (!provider.buildRequestBody) {
    return ok(
      JSON.stringify({
        ...filteredContext.parsedBody,
        model: endpoint.providerModelId,
      })
    );
  }

  try {
    const result = await provider.buildRequestBody(endpoint, filteredContext);
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

export function validateProvider(
  provider: string
): provider is ModelProviderName {
  return provider in providers;
}

/**
 * Model name mapping for backward compatibility
 * Maps deprecated/incorrect model names to their correct counterparts
 */
const MODEL_NAME_MAPPINGS: Record<string, string> = {
  "gemini-1.5-flash": "gemini-2.5-flash-lite",
  "claude-3.5-sonnet": "claude-3.5-sonnet-v2",
  "claude-3.5-sonnet-20240620": "claude-3.5-sonnet-v2",
  "deepseek-r1": "deepseek-reasoner",
  "kimi-k2": "kimi-k2-0711",
  "kimi-k2-instruct": "kimi-k2-0905",
};

export function parseModelString(
  modelString: string
): Result<ModelSpec, string> {
  const parts = modelString.split("/");
  let modelName = parts[0];
  let isOnline = false;

  // Check if model name has :online suffix
  if (modelName.endsWith(":online")) {
    isOnline = true;
    modelName = modelName.slice(0, -7);
  }

  // Apply model name mapping for backward compatibility
  modelName = MODEL_NAME_MAPPINGS[modelName] || modelName;

  // Just model name: "gpt-4"
  if (parts.length === 1) {
    // Check if model is known
    const validModels = registry.getAllModelIds();
    const isKnownModel =
      validModels.data && validModels.data.includes(modelName as any);

    // Fail fast: unknown model with no provider
    if (!isKnownModel) {
      return err(
        `Unknown model: ${modelName}. Please specify a provider (e.g., ${modelName}/openai) or use a supported model. See https://helicone.ai/models`
      );
    }
    return ok({
      modelName,
      isOnline,
    });
  }

  // Has provider - validate it once
  const provider = parts[1];
  if (!validateProvider(provider)) {
    const validProviders = Object.keys(providers);
    return err(
      `Invalid provider: ${provider}. Valid providers: ${validProviders.join(", ")}`
    );
  }

  return ok({
    modelName,
    provider,
    customUid: parts.length === 3 ? parts[2] : undefined,
    isOnline,
  });
}
