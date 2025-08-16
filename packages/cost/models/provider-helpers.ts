import { err, ok, Result } from "../../common/result";
import type {
  Endpoint,
  ModelProviderConfig,
  UserEndpointConfig,
  AuthContext,
  AuthResult,
  RequestBodyContext,
} from "./types";
import { providers, ProviderName } from "./providers";
import { BaseProvider } from "./providers/base";

// Helper function to get provider instance
export function getProvider(providerName: string): Result<BaseProvider> {
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

  try {
    const url = provider.buildUrl(endpointConfig, userConfig);
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
      region: userConfig.region,
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
