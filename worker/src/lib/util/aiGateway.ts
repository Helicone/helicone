import {
  buildEndpointUrl,
  buildModelId,
  getEndpoint,
  getProvider,
  ModelName,
  ProviderConfig,
  getModelEndpoints,
  type Endpoint,
  authenticateRequest as authenticateProviderRequest,
} from "@helicone-package/cost/models";
import { RequestWrapper } from "../RequestWrapper";
import { APIKeysManager } from "../managers/APIKeysManager";
import { APIKeysStore } from "../db/APIKeysStore";
import { err, isErr, ok, Result } from "./results";
import { ProviderKeysManager } from "../managers/ProviderKeysManager";
import { toAnthropic } from "../clients/llmmapper/providers/openai/request/toAnthropic";
import { HeliconeHeaders } from "../models/HeliconeHeaders";
import { ProviderKey } from "../db/ProviderKeysStore";
import { getEndpoints, ModelEndpoint } from "@helicone-package/cost/models";
import { ProviderName } from "@helicone-package/cost/models/types";
import { PromptManager } from "../managers/PromptManager";
import { costOf } from "@helicone-package/cost";
import { Wallet } from "../durableObjects/Wallet";

type Error = {
  type:
    | "invalid_format"
    | "missing_provider_key"
    | "request_failed"
    | "invalid_prompt"
    | "model_not_supported";
  message: string;
  code: number;
};

export const getBody = async (requestWrapper: RequestWrapper) => {
  if (requestWrapper.getMethod() === "GET") {
    return null;
  }

  if (requestWrapper.heliconeHeaders.featureFlags.streamUsage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonBody = (await requestWrapper.getJson()) as any;
    if (!jsonBody["stream_options"]) {
      jsonBody["stream_options"] = {};
    }
    jsonBody["stream_options"]["include_usage"] = true;
    return JSON.stringify(jsonBody);
  }

  return await requestWrapper.getText();
};

export const authenticate = async (
  requestWrapper: RequestWrapper,
  env: Env,
  store: APIKeysStore
) => {
  const apiKeyManager = new APIKeysManager(store, env);
  const rawAPIKey = await requestWrapper.getRawProviderAuthHeader();
  const hashedAPIKey = await requestWrapper.getProviderAuthHeader();
  const orgId = await apiKeyManager.getAPIKeyWithFetch(hashedAPIKey ?? "");

  return { orgId, rawAPIKey };
};

type DirectProviderEndpoint = {
  type: "direct";
  provider: ProviderName;
  providerConfig: ProviderConfig;
  modelName: string;
};

type EndpointsProviderEndpoint = {
  type: "endpoints";
  endpoints: Endpoint[];
};

type ValidateModelStringResult = Result<
  DirectProviderEndpoint | EndpointsProviderEndpoint,
  Error
>;

const validateModelString = (model: string): ValidateModelStringResult => {
  const modelParts = model.split("/");
  if (modelParts.length !== 2) {
    const endpointsResult = getModelEndpoints(model);
    if (
      endpointsResult.error ||
      !endpointsResult.data ||
      endpointsResult.data.length === 0
    ) {
      return err({
        type: "invalid_format",
        message: "Invalid model",
        code: 400,
      });
    }
    return ok({ type: "endpoints", endpoints: endpointsResult.data });
  }

  const [modelName, providerName] = modelParts;
  const providerResult = getProvider(providerName);

  if (providerResult.error || !providerResult.data) {
    return err({
      type: "invalid_format",
      message: "Invalid model",
      code: 400,
    });
  }

  return ok({
    type: "direct",
    provider: providerName as ProviderName,
    modelName,
    providerConfig: providerResult.data,
  });
};

const authenticateRequest = async (
  requestWrapper: RequestWrapper,
  providerKey: ProviderKey,
  model: string,
  body: string,
  heliconeHeaders: HeliconeHeaders,
  targetBaseUrl: string | null,
  endpoint: Endpoint
) => {
  requestWrapper.resetObject();
  requestWrapper.setHeader(
    "Helicone-Auth",
    requestWrapper.getAuthorization() ?? ""
  );
  requestWrapper.setUrl(targetBaseUrl ?? requestWrapper.url.toString());

  // Use the unified authenticate function from the cost package
  const authResult = await authenticateProviderRequest(endpoint, {
    config: (providerKey.config as any) || {},
    apiKey: providerKey.decrypted_provider_key,
    secretKey: providerKey.decrypted_provider_secret_key || undefined,
    bodyMapping: heliconeHeaders.gatewayConfig.bodyMapping,
    requestMethod: requestWrapper.getMethod(),
    requestUrl: targetBaseUrl ?? requestWrapper.url.toString(),
    requestBody: body,
  });

  if (authResult.error) {
    throw new Error(`Authentication failed: ${authResult.error}`);
  }

  for (const [key, value] of Object.entries(authResult.data?.headers || {})) {
    requestWrapper.setHeader(key, value);
  }
  // // For Bedrock, we need to replace all headers with the signed ones
  // if (providerKey.provider === "bedrock") {
  //   const newHeaders = new Headers();
  //   for (const [key, value] of Object.entries(authResult.data?.headers || {})) {
  //     newHeaders.set(key, value);
  //   }
  //   requestWrapper.remapHeaders(newHeaders);
  // } else {
  //   // For other providers, just set the auth headers
  //   for (const [key, value] of Object.entries(authResult.data?.headers || {})) {
  //     requestWrapper.setHeader(key, value);
  //   }
  // }
};

const prepareRequestBody = (
  parsedBody: any,
  model: string,
  provider: ProviderName,
  heliconeHeaders: HeliconeHeaders
): string => {
  if (
    model.includes("claude-") &&
    (provider === "bedrock" || provider === "vertex")
  ) {
    const anthropicBody =
      heliconeHeaders.gatewayConfig.bodyMapping === "OPENAI"
        ? toAnthropic(parsedBody)
        : parsedBody;
    const updatedBody = {
      ...anthropicBody,
      ...(provider === "bedrock"
        ? { anthropic_version: "bedrock-2023-05-31", model: undefined }
        : provider === "vertex"
          ? { anthropic_version: "vertex-2023-10-16", model: undefined }
          : { model: model }),
    };
    return JSON.stringify(updatedBody);
  } else {
    const updatedBody = {
      ...parsedBody,
      model: model,
    };
    return JSON.stringify(updatedBody);
  }
};

export type EscrowInfo = {
  escrowId: string;
  provider: string;
  model: string;
};

const attemptDirectProviderRequest = async (
  directProviderEndpoint: DirectProviderEndpoint,
  requestWrapper: RequestWrapper,
  forwarder: (
    targetBaseUrl: string | null,
    escrowInfo?: EscrowInfo
  ) => Promise<Response>,
  providerKeysManager: ProviderKeysManager,
  orgId: string,
  parsedBody: any,
  env: Env,
  ctx: ExecutionContext
): Promise<Result<Response, Error>> => {
  const { provider, modelName } = directProviderEndpoint;
  const providerKey = await providerKeysManager.getProviderKeyWithFetch(
    provider,
    orgId,
    requestWrapper
  );

  if (!providerKey) {
    return err({
      type: "missing_provider_key",
      message: "Missing/Incorrect provider key",
      code: 400,
    });
  }

  const endpointResult = getEndpoint(modelName, provider);
  let endpoint: Endpoint;
  let providerModelId: string;

  if (endpointResult.error || !endpointResult.data) {
    // backwards compatibility if someone passes the explicit model id used by the provider
    endpoint = {
      providerModelId: modelName,
      modelId: modelName as ModelName,
      ptbEnabled: false,
      provider,
      pricing: {
        prompt: 0,
        completion: 0,
      },
      contextLength: 0,
      maxCompletionTokens: 0,
      supportedParameters: [],
    };
    providerModelId = modelName;
  } else {
    endpoint = endpointResult.data;
    // Extract config once with proper typing
    const config = providerKey.config as
      | {
          region?: string;
          crossRegion?: string;
          projectId?: string;
        }
      | null
      | undefined;

    const modelIdResult = buildModelId(endpoint, {
      region: config?.region ?? "us-west-1",
      crossRegion: config?.crossRegion === "true",
      projectId: config?.projectId,
    });
    providerModelId =
      modelIdResult.error || !modelIdResult.data
        ? modelName
        : modelIdResult.data;
  }
  const body = prepareRequestBody(
    parsedBody,
    providerModelId,
    provider,
    requestWrapper.heliconeHeaders
  );

  requestWrapper.setBody(body);

  // Extract config once with proper typing
  const config = providerKey.config as
    | {
        region?: string;
        location?: string;
        crossRegion?: string;
        projectId?: string;
        deploymentName?: string;
        resourceName?: string;
      }
    | null
    | undefined;

  const targetBaseUrlResult = buildEndpointUrl(endpoint, {
    region: config?.region ?? config?.location ?? "us-west-1",
    crossRegion: config?.crossRegion === "true",
    projectId: config?.projectId,
    deploymentName: config?.deploymentName,
    resourceName: config?.resourceName,
  });

  if (targetBaseUrlResult.error || !targetBaseUrlResult.data) {
    return err({
      type: "request_failed",
      message: targetBaseUrlResult.error || "Failed to get target base URL",
      code: 500,
    });
  }

  const targetBaseUrl = targetBaseUrlResult.data;

  let escrowId: string | undefined;
  // if cloud billing is enabled, we want to 'reserve' the maximum possible
  // cost of the request in their wallet so that we can avoid overages
  if (requestWrapper.heliconeHeaders.cloudBillingEnabled) {
    const walletId = env.WALLET.idFromName(orgId);
    const walletStub = env.WALLET.get(walletId);

    const costStructure = costOf({
      model: providerModelId,
      provider: provider,
    });
    if (
      !costStructure ||
      endpoint.contextLength === 0 ||
      endpoint.maxCompletionTokens === 0 ||
      costStructure.prompt_token === 0 ||
      costStructure.completion_token === 0
    ) {
      return err({
        type: "model_not_supported",
        message: `No cost structure found for (provider, model): (${provider}, ${providerModelId})`,
        code: 400,
      });
    }
    const state = await walletStub.getWalletState(orgId);
    if (isErr(state)) {
      return err({
        type: "request_failed",
        message: state.error,
        code: 500,
      });
    }
    for (const entry of state.data.disallowList) {
      if (entry.provider === null || entry.model === null) {
        return err({
          type: "request_failed",
          message: "Currently cloud billing is disabled for this org. Please contact support@helicone.ai for help",
          code: 400,
        });
      }
      if (entry.provider === provider && entry.model === providerModelId) {
        return err({
          type: "request_failed",
          message: "Currently cloud billing is disabled for this model and provider. Please contact support@helicone.ai for help",
          code: 400,
        });
      }
    }

    // Estimate Cmax: total maximum worst case possible cost of a model request
    // TODO: ask Cole if we need to get the scale factor from the dynamic data
    const maxPromptCost =
      (endpoint.contextLength * costStructure.prompt_token) / 1_000_000;
    const maxCompletionCost =
      (endpoint.maxCompletionTokens * costStructure.completion_token) /
      1_000_000;
    const worstCaseCost = (maxPromptCost + maxCompletionCost);

    const requestId = requestWrapper.heliconeHeaders.requestId;
    const escrowResult = await walletStub.reserveCostInEscrow(
      orgId,
      requestId,
      worstCaseCost
    );

    if (escrowResult.error) {
      return err({
        type: "request_failed",
        message: escrowResult.error,
        code: 429,
      });
    }

    escrowId = escrowResult.data?.escrowId;
  }

  await authenticateRequest(
    requestWrapper,
    providerKey,
    providerModelId,
    body,
    requestWrapper.heliconeHeaders,
    targetBaseUrl,
    endpoint
  );

  try {
    const escrowInfo = escrowId ? { escrowId, provider, model: providerModelId } : undefined;
    const response = await forwarder(targetBaseUrl, escrowInfo);

    if (response.ok) {
      return ok(response);
    }

    // Clean up escrow on error
    if (escrowId) {
      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);
      ctx.waitUntil(
        walletStub.cancelEscrow(escrowId).catch((err) => {
          console.error(`Failed to cancel escrow ${escrowId}:`, err);
        })
      );
    }

    try {
      const responseBody = await response.json();
      return err({
        type: "request_failed",
        message:
          (responseBody as { message?: string })?.message ??
          (responseBody as { error?: { message?: string } })?.error?.message ??
          response.statusText,
        code: response.status,
      });
    } catch (error) {
      return err({
        type: "request_failed",
        message: response.statusText,
        code: response.status,
      });
    }
  } catch (error) {
    return err({
      type: "request_failed",
      message: error instanceof Error ? error.message : "Unknown error",
      code: 500,
    });
  }
};

const attemptEndpointsProviderRequest = async (
  modelName: string,
  endpointsProviderEndpoint: EndpointsProviderEndpoint,
  requestWrapper: RequestWrapper,
  forwarder: (
    targetBaseUrl: string | null,
    escrowInfo?: EscrowInfo
  ) => Promise<Response>,
  providerKeysManager: ProviderKeysManager,
  orgId: string,
  parsedBody: any,
  env: Env,
  ctx: ExecutionContext
): Promise<Result<Response, Error>> => {
  const { endpoints } = endpointsProviderEndpoint;

  let error: Error | null = null;
  for (const endpoint of endpoints) {
    const providerResult = getProvider(endpoint.provider);
    if (providerResult.error || !providerResult.data) {
      continue;
    }

    const result = await attemptDirectProviderRequest(
      {
        type: "direct",
        provider: endpoint.provider as ProviderName,
        modelName,
        providerConfig: providerResult.data,
      },
      requestWrapper,
      forwarder,
      providerKeysManager,
      orgId,
      parsedBody,
      env,
      ctx
    );

    if (!isErr(result)) {
      return result;
    }
    error = result.error;
  }

  return err(
    error ?? {
      type: "request_failed",
      message: "All models failed",
      code: 500,
    }
  );
};

const attemptModelRequest = async ({
  model,
  requestWrapper,
  forwarder,
  providerKeysManager,
  orgId,
  parsedBody,
  env,
  ctx,
}: {
  model: string;
  requestWrapper: RequestWrapper;
  forwarder: (
    targetBaseUrl: string | null,
    escrowInfo?: EscrowInfo
  ) => Promise<Response>;
  providerKeysManager: ProviderKeysManager;
  orgId: string;
  parsedBody: any;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Result<Response, Error>> => {
  const result = validateModelString(model);
  if (isErr(result)) {
    return err(result.error);
  }

  if (result.data.type == "direct") {
    const directProviderRequestResult = await attemptDirectProviderRequest(
      result.data,
      requestWrapper,
      forwarder,
      providerKeysManager,
      orgId,
      parsedBody,
      env,
      ctx
    );
    return directProviderRequestResult;
  }

  const endpointsProviderRequestResult = await attemptEndpointsProviderRequest(
    model,
    result.data,
    requestWrapper,
    forwarder,
    providerKeysManager,
    orgId,
    parsedBody,
    env,
    ctx
  );

  return endpointsProviderRequestResult;
};

export const attemptModelRequestWithFallback = async ({
  models,
  requestWrapper,
  forwarder,
  providerKeysManager,
  promptManager,
  orgId,
  parsedBody,
  env,
  ctx,
}: {
  models: string[];
  requestWrapper: RequestWrapper;
  forwarder: (
    targetBaseUrl: string | null,
    escrowInfo?: EscrowInfo
  ) => Promise<Response>;
  providerKeysManager: ProviderKeysManager;
  promptManager: PromptManager;
  orgId: string;
  parsedBody: any;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Result<Response, Error>> => {
  if (models.length === 0) {
    return err({
      type: "invalid_format",
      message: "No models provided",
      code: 400,
    });
  }

  if (parsedBody.prompt_id) {
    const result = await promptManager.getMergedPromptBody(parsedBody, orgId);
    if (isErr(result)) {
      return err({
        type: "invalid_prompt",
        message: result.error,
        code: 400,
      });
    }

    if (result.data.errors && result.data.errors.length > 0) {
      return err({
        type: "invalid_prompt",
        message: result.data.errors
          .map(
            (error) =>
              `Variable '${error.variable}' is '${error.expected}' but got '${error.value}'`
          )
          .join("\n"),
        code: 400,
      });
    }

    requestWrapper.setPrompt2025Settings({
      promptId: parsedBody.prompt_id,
      promptVersionId: result.data.promptVersionId,
      inputs: parsedBody.inputs,
      environment: parsedBody.environment,
    });

    parsedBody = result.data.body;
  }

  let error: Error | null = null;
  for (const model of models) {
    const result = await attemptModelRequest({
      model,
      requestWrapper,
      forwarder,
      providerKeysManager,
      orgId,
      parsedBody,
      env,
      ctx,
    });
    if (!isErr(result)) {
      return result;
    }
    error = result.error;
  }

  return err(
    error ?? {
      type: "request_failed",
      message: "All models failed",
      code: 500,
    }
  );
};
