import {
  buildRequestBody,
  getProvider,
  authenticateRequest as authenticateProviderRequest,
} from "@helicone-package/cost/models/provider-helpers";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { BaseProvider } from "@helicone-package/cost/models/providers/base";
import { RequestWrapper } from "../RequestWrapper";
import { toAnthropic } from "../clients/llmmapper/providers/openai/request/toAnthropic";
import { APIKeysStore } from "../db/APIKeysStore";
import { ProviderKey } from "../db/ProviderKeysStore";
import { APIKeysManager } from "../managers/APIKeysManager";
import { PromptManager } from "../managers/PromptManager";
import { ProviderKeysManager } from "../managers/ProviderKeysManager";
import { HeliconeHeaders } from "../models/HeliconeHeaders";
import { err, isErr, ok, Result } from "./results";
import { registry } from "@helicone-package/cost/models/registry";
import {
  Endpoint,
  UserEndpointConfig,
} from "@helicone-package/cost/models/types";
import { DisallowListEntry } from "../durable-objects/Wallet";

type Error = {
  type:
    | "invalid_format"
    | "missing_provider_key"
    | "request_failed"
    | "invalid_prompt"
    | "model_not_supported";
  message: string;
  statusCode: number;
  details?: string;
};

const enableStreamUsage = async (
  requestWrapper: RequestWrapper,
  bodyMapping: "OPENAI" | "NO_MAPPING"
) => {
  const jsonBody = (await requestWrapper.getJson()) as Record<string, unknown>;
  if (
    "stream" in jsonBody &&
    jsonBody.stream === true &&
    bodyMapping === "OPENAI"
  ) {
    const bodyWithUsage = {
      ...jsonBody,
      stream_options: {
        ...((jsonBody.stream_options as Record<string, unknown>) || {}),
        include_usage: true,
      },
    };
    return JSON.stringify(bodyWithUsage);
  }
  return await requestWrapper.getText();
};

export const getBody = async (requestWrapper: RequestWrapper) => {
  if (requestWrapper.getMethod() === "GET") {
    return null;
  }

  return enableStreamUsage(
    requestWrapper,
    requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping
  );
};

export const authenticate = async (
  requestWrapper: RequestWrapper,
  env: Env,
  store: APIKeysStore
) => {
  const apiKeyManager = new APIKeysManager(store, env);
  const rawAPIKey = requestWrapper.getRawProviderAuthHeader();
  const hashedAPIKey = await requestWrapper.getProviderAuthHeader();
  const orgId = await apiKeyManager.getOrgIdWithFetch(hashedAPIKey ?? "");

  return { orgId, rawAPIKey };
};

type DirectProviderEndpoint = {
  type: "direct";
  provider: ModelProviderName;
  providerConfig: BaseProvider;
  modelName: string;
  cuid?: string;
};

type EndpointsProviderEndpoint = {
  type: "endpoints";
  providers: Set<ModelProviderName>;
};

type ValidateModelStringResult = Result<
  DirectProviderEndpoint | EndpointsProviderEndpoint,
  Error
>;

const validateModelString = (model: string): ValidateModelStringResult => {
  const modelParts = model.split("/");
  if (modelParts.length < 2) {
    const providersResult = registry.getModelProviders(model);
    if (
      providersResult.error ||
      !providersResult.data ||
      providersResult.data.size === 0
    ) {
      return err({
        type: "invalid_format",
        message: "Invalid model",
        statusCode: 400,
      });
    }
    return ok({ type: "endpoints", providers: providersResult.data });
  }

  const [modelName, providerName, cuid] = modelParts;
  const providerResult = getProvider(providerName);

  if (providerResult.error || !providerResult.data) {
    return err({
      type: "invalid_format",
      message: "Invalid model",
      statusCode: 400,
    });
  }

  return ok({
    type: "direct",
    provider: providerName as ModelProviderName,
    modelName,
    providerConfig: providerResult.data,
    cuid: cuid ?? undefined,
  });
};

const authenticateRequest = async (
  requestWrapper: RequestWrapper,
  providerKey: ProviderKey,
  body: string,
  heliconeHeaders: HeliconeHeaders,
  targetBaseUrl: string | null,
  endpoint: Endpoint
) => {
  requestWrapper.setHeader(
    "Helicone-Auth",
    requestWrapper.getAuthorization() ?? ""
  );
  requestWrapper.resetObject();
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
    return err({
      type: "request_failed",
      message: `Authentication failed: ${authResult.error}`,
      statusCode: 401,
    });
  }

  for (const [key, value] of Object.entries(authResult.data?.headers || {})) {
    requestWrapper.setHeader(key, value);
  }
};

const parseErrorResponse = async (
  response: Response
): Promise<Result<never, Error>> => {
  try {
    const responseBody = await response.json();
    const errorMessage =
      (responseBody as { message?: string })?.message ??
      (responseBody as { error?: { message?: string } })?.error?.message ??
      response.statusText;

    return err({
      type: "request_failed",
      message: errorMessage,
      statusCode: response.status,
    });
  } catch {
    return err({
      type: "request_failed",
      message: response.statusText,
      statusCode: response.status,
    });
  }
};

const sendRequest = async (
  endpoint: Endpoint,
  parsedBody: any,
  requestWrapper: RequestWrapper,
  providerKey: ProviderKey,
  forwarder: (
    targetBaseUrl: string | null,
    escrowInfo?: EscrowInfo
  ) => Promise<Response>,
  escrowInfo?: EscrowInfo
): Promise<Result<Response, Error>> => {
  const body = await buildRequestBody(endpoint, {
    parsedBody,
    bodyMapping: requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
    toAnthropic: toAnthropic,
  });

  if (isErr(body) || !body.data) {
    return err({
      type: "request_failed",
      message: body.error || "Failed to build request body",
      statusCode: 500,
    });
  }

  requestWrapper.setBody(body.data);

  const targetBaseUrl = endpoint.baseUrl;

  await authenticateRequest(
    requestWrapper,
    providerKey,
    body.data,
    requestWrapper.heliconeHeaders,
    targetBaseUrl,
    endpoint
  );

  try {
    const response = await forwarder(targetBaseUrl, escrowInfo);

    if (response.ok) {
      return ok(response);
    }

    return await parseErrorResponse(response);
  } catch (error) {
    return err({
      type: "request_failed",
      message: error instanceof Error ? error.message : "Unknown error",
      statusCode: 500,
    });
  }
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
  ctx: ExecutionContext,
  disallowList: DisallowListEntry[]
): Promise<Result<Response, Error>> => {
  const { provider, modelName, cuid } = directProviderEndpoint;
  const userProviderKeyWithConfig =
    await providerKeysManager.getProviderKeyWithFetch(provider, orgId, cuid);

  const userEndpointConfig = {
    ...((userProviderKeyWithConfig?.config ?? {}) as UserEndpointConfig),
    gatewayMapping: requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
  };

  // Try to get PTB endpoints first
  const endpointsResult = registry.getPtbEndpoints(modelName, provider);
  let endpoints: Endpoint[];
  if (endpointsResult.data && endpointsResult.data.length > 0) {
    endpoints = endpointsResult.data;
  } else if (
    userProviderKeyWithConfig &&
    isByokEnabled(userProviderKeyWithConfig)
  ) {
    // Fall back to creating a custom endpoint
    const fallback = registry.createFallbackEndpoint(
      modelName,
      provider,
      userEndpointConfig
    );
    if (isErr(fallback)) {
      return err({
        type: "request_failed",
        message: fallback.error || "Failed to create fallback endpoint",
        statusCode: 500,
      });
    }

    const result = await sendRequest(
      fallback.data,
      parsedBody,
      requestWrapper,
      userProviderKeyWithConfig,
      forwarder
    );
    if (isErr(result)) {
      return err(result.error);
    }

    return result;
  } else {
    return err({
      type: "missing_provider_key",
      message: "No BYOK provider key enabled",
      statusCode: 400,
    });
  }

  const modelProviderConfig = registry.getModelProviderConfig(
    modelName,
    provider
  );

  if (isErr(modelProviderConfig)) {
    return err({
      type: "request_failed",
      message: modelProviderConfig.error || "Failed to get endpoint config",
      statusCode: 500,
    });
  }

  if (userProviderKeyWithConfig && isByokEnabled(userProviderKeyWithConfig)) {
    const byokEndpoint = registry.buildEndpoint(
      modelProviderConfig.data,
      userEndpointConfig
    );

    if (isErr(byokEndpoint)) {
      return err({
        type: "request_failed",
        message: byokEndpoint.error || "Failed to build BYOK endpoint",
        statusCode: 500,
      });
    }
    const result = await sendRequest(
      byokEndpoint.data,
      parsedBody,
      requestWrapper,
      userProviderKeyWithConfig,
      forwarder,
      undefined
    );

    return result;
  }

  // now fetch the helicone provider key since PTB must be enabled
  // and merge the helicone api key with the user config so that we pick up their settings
  const heliconeKeyWithConfig =
    await providerKeysManager.getProviderKeyWithFetch(
      provider,
      env.HELICONE_ORG_ID
    );
  if (!heliconeKeyWithConfig) {
    console.error("no helicone key found");
    return err({
      type: "missing_provider_key",
      message: "Missing Helicone provider key required for PTB",
      statusCode: 500,
    });
  }

  const finalConfig: ProviderKey = userProviderKeyWithConfig
    ? {
        ...userProviderKeyWithConfig,
        decrypted_provider_key: heliconeKeyWithConfig.decrypted_provider_key,
        decrypted_provider_secret_key:
          heliconeKeyWithConfig.decrypted_provider_secret_key,
      }
    : heliconeKeyWithConfig;

  const walletId = env.WALLET.idFromName(orgId);
  const walletStub = env.WALLET.get(walletId);
  for (const endpoint of endpoints) {
    if (!endpoint.ptbEnabled) {
      console.log("PTB is disabled for this endpoint, skipping");
      continue;
    }
    // if cloud billing is enabled, we want to 'reserve' the maximum possible
    // cost of the request in their wallet so that we can avoid overages
    const isDisallowed = disallowList.some(
      (entry) =>
        (entry.provider === endpoint.provider &&
          entry.model === endpoint.providerModelId) ||
        (entry.provider === endpoint.provider && entry.model === "*")
    );

    if (isDisallowed) {
      return err({
        type: "request_failed",
        message:
          "Cloud billing is disabled for this model and provider. Please contact support@helicone.ai for help",
        statusCode: 400,
      });
    }
    const escrowReservation = await reserveEscrow(
      requestWrapper,
      env,
      orgId,
      endpoint
    );
    if (isErr(escrowReservation)) {
      return err(escrowReservation.error);
    }
    const escrowInfo = {
      escrowId: escrowReservation.data.escrowId,
      endpoint,
      model: modelName,
    };
    const result = await sendRequest(
      endpoint,
      parsedBody,
      requestWrapper,
      finalConfig,
      forwarder,
      escrowInfo
    );

    if (!isErr(result)) {
      return result;
    }
    // Clean up escrow on error
    ctx.waitUntil(
      walletStub.cancelEscrow(escrowInfo.escrowId).catch((err) => {
        console.error(`Failed to cancel escrow ${escrowInfo.escrowId}:`, err);
      })
    );
  }

  return err({
    type: "request_failed",
    message: "All models failed",
    statusCode: 500,
  });
};

const attemptProvidersRequest = async (
  modelName: string,
  providersEndpoint: EndpointsProviderEndpoint,
  requestWrapper: RequestWrapper,
  forwarder: (
    targetBaseUrl: string | null,
    escrowInfo?: EscrowInfo
  ) => Promise<Response>,
  providerKeysManager: ProviderKeysManager,
  orgId: string,
  parsedBody: any,
  env: Env,
  ctx: ExecutionContext,
  disallowList: DisallowListEntry[]
): Promise<Result<Response, Error>> => {
  const { providers } = providersEndpoint;

  let error: Error | null = null;
  for (const provider of providers) {
    const providerResult = getProvider(provider);
    if (isErr(providerResult) || !providerResult.data) {
      continue;
    }

    const result = await attemptDirectProviderRequest(
      {
        type: "direct",
        provider,
        modelName,
        providerConfig: providerResult.data,
        cuid: undefined,
      },
      requestWrapper,
      forwarder,
      providerKeysManager,
      orgId,
      parsedBody,
      env,
      ctx,
      disallowList
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
      statusCode: 500,
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
  disallowList,
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
  disallowList: DisallowListEntry[];
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
      ctx,
      disallowList
    );
    return directProviderRequestResult;
  }

  const endpointsProviderRequestResult = await attemptProvidersRequest(
    model,
    result.data,
    requestWrapper,
    forwarder,
    providerKeysManager,
    orgId,
    parsedBody,
    env,
    ctx,
    disallowList
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
      statusCode: 400,
    });
  }

  if (
    parsedBody.prompt_id ||
    parsedBody.environment ||
    parsedBody.version_id ||
    parsedBody.inputs
  ) {
    const result = await promptManager.getMergedPromptBody(parsedBody, orgId);
    if (isErr(result)) {
      return err({
        type: "invalid_prompt",
        message: result.error,
        statusCode: 400,
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
        statusCode: 400,
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

  let disallowList: DisallowListEntry[];
  try {
    const walletId = env.WALLET.idFromName(orgId);
    const walletStub = env.WALLET.get(walletId);
    disallowList = await walletStub.getDisallowList();
  } catch (e) {
    return err({
      type: "request_failed",
      message: e instanceof Error ? e.message : "Unknown error",
      statusCode: 500,
    });
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
      disallowList,
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
      statusCode: 500,
    }
  );
};

export type EscrowInfo = {
  escrowId: string;
  endpoint: Endpoint;
  model: string;
};

function isByokEnabled(providerKey: ProviderKey): boolean {
  // if not set, assume true to preserve backwards compatibility
  const legacyByokEnabled =
    providerKey.byok_enabled === undefined || providerKey.byok_enabled === null;
  return legacyByokEnabled || providerKey.byok_enabled === true;
}

const reserveEscrow = async (
  requestWrapper: RequestWrapper,
  env: Env,
  orgId: string,
  endpoint: Endpoint
): Promise<Result<{ escrowId: string }, Error>> => {
  const walletId = env.WALLET.idFromName(orgId);
  const walletStub = env.WALLET.get(walletId);

  // Use first pricing tier (threshold 0)
  const firstTierPricing = endpoint.pricing[0];
  if (
    !firstTierPricing ||
    endpoint.contextLength === 0 ||
    endpoint.maxCompletionTokens === 0 ||
    firstTierPricing.input === 0 ||
    firstTierPricing.output === 0 ||
    firstTierPricing.image === 0 ||
    firstTierPricing.thinking === 0
  ) {
    return err({
      type: "model_not_supported",
      message: `Cost not supported for (provider, model): (${endpoint.provider}, ${endpoint.providerModelId})`,
      statusCode: 400,
    });
  }

  const maxPromptCost = endpoint.contextLength * firstTierPricing.input;
  const maxCompletionCost =
    endpoint.maxCompletionTokens * firstTierPricing.output;
  const worstCaseCost = maxPromptCost + maxCompletionCost;
  if (worstCaseCost <= 0) {
    return err({
      type: "request_failed",
      message: `Invalid cost structure found for (provider, model): (${endpoint.provider}, ${endpoint.providerModelId})`,
      statusCode: 500,
    });
  }

  const requestId = requestWrapper.heliconeHeaders.requestId;
  try {
    const escrowResult = await walletStub.reserveCostInEscrow(
      orgId,
      requestId,
      worstCaseCost
    );
    if (isErr(escrowResult)) {
      return err({
        type: "request_failed",
        message: escrowResult.error.message,
        statusCode: escrowResult.error.statusCode,
      });
    }
    return ok(escrowResult.data);
  } catch (e) {
    return err({
      type: "request_failed",
      message: e instanceof Error ? e.message : "Unknown error",
      statusCode: 500,
    });
  }
};
