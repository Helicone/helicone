import {
  buildRequestBody,
  getProvider,
  authenticateRequest as authenticateProviderRequest,
} from "@helicone-package/cost/models/provider-helpers";
import { ProviderName } from "@helicone-package/cost/models/providers";
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
import { HeliconePromptParams } from "@helicone-package/prompts/types";

type Error = {
  type:
    | "invalid_format"
    | "missing_provider_key"
    | "request_failed"
    | "invalid_prompt";
  message: string;
  code: number;
};

const DEFAULT_REGION = "us-west-1";

const enableStreamUsage = async (requestWrapper: RequestWrapper) => {
  const jsonBody = (await requestWrapper.getJson()) as Record<string, unknown>;
  const bodyWithUsage = {
    ...jsonBody,
    stream_options: {
      ...((jsonBody.stream_options as Record<string, unknown>) || {}),
      include_usage: true,
    },
  };
  return JSON.stringify(bodyWithUsage);
};

export const getBody = async (requestWrapper: RequestWrapper) => {
  if (requestWrapper.getMethod() === "GET") {
    return null;
  }

  if (requestWrapper.heliconeHeaders.featureFlags.streamUsage) {
    return enableStreamUsage(requestWrapper);
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
  providerConfig: BaseProvider;
  modelName: string;
};

type EndpointsProviderEndpoint = {
  type: "endpoints";
  providers: Set<ProviderName>;
};

type ValidateModelStringResult = Result<
  DirectProviderEndpoint | EndpointsProviderEndpoint,
  Error
>;

const validateModelString = (model: string): ValidateModelStringResult => {
  const modelParts = model.split("/");
  if (modelParts.length !== 2) {
    const providersResult = registry.getModelProviders(model);
    if (
      providersResult.error ||
      !providersResult.data ||
      providersResult.data.size === 0
    ) {
      return err({
        type: "invalid_format",
        message: "Invalid model",
        code: 400,
      });
    }
    return ok({ type: "endpoints", providers: providersResult.data });
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
    return err({
      type: "request_failed",
      message: `Authentication failed: ${authResult.error}`,
      code: 401,
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
      code: response.status,
    });
  } catch {
    return err({
      type: "request_failed",
      message: response.statusText,
      code: response.status,
    });
  }
};

const sendRequest = async (
  endpoint: Endpoint,
  parsedBody: any,
  requestWrapper: RequestWrapper,
  providerKey: ProviderKey,
  forwarder: (targetBaseUrl: string | null) => Promise<Response>
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
      code: 500,
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
    const response = await forwarder(targetBaseUrl);

    if (response.ok) {
      return ok(response);
    }

    return await parseErrorResponse(response);
  } catch (error) {
    return err({
      type: "request_failed",
      message: error instanceof Error ? error.message : "Unknown error",
      code: 500,
    });
  }
};

const attemptDirectProviderRequest = async (
  directProviderEndpoint: DirectProviderEndpoint,
  requestWrapper: RequestWrapper,
  forwarder: (targetBaseUrl: string | null) => Promise<Response>,
  providerKeysManager: ProviderKeysManager,
  orgId: string,
  parsedBody: any
): Promise<Result<Response, Error>> => {
  const { provider, modelName } = directProviderEndpoint;
  const providerKey = await providerKeysManager.getProviderKeyWithFetch(
    provider,
    orgId
  );

  if (!providerKey) {
    return err({
      type: "missing_provider_key",
      message: "Missing/Incorrect provider key",
      code: 400,
    });
  }

  const userEndpointConfig = providerKey.config as UserEndpointConfig;

  // Try to get PTB endpoints first
  // const endpointsResult: Result<Endpoint[], Error> = ok([]);
  const endpointsResult = registry.getPtbEndpoints(modelName, provider);

  let endpoints: Endpoint[];
  if (endpointsResult.data && endpointsResult.data.length > 0) {
    endpoints = endpointsResult.data;
  } else {
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
        code: 500,
      });
    }

    const result = await sendRequest(
      fallback.data,
      parsedBody,
      requestWrapper,
      providerKey,
      forwarder
    );

    if (isErr(result)) {
      return err(result.error);
    }

    return result;
  }

  const modelProviderConfig = registry.getModelProviderConfig(
    modelName,
    provider
  );

  if (isErr(modelProviderConfig)) {
    return err({
      type: "request_failed",
      message: modelProviderConfig.error || "Failed to get endpoint config",
      code: 500,
    });
  }

  const byokEndpoint = registry.buildEndpoint(
    modelProviderConfig.data,
    userEndpointConfig
  );

  if (isErr(byokEndpoint)) {
    return err({
      type: "request_failed",
      message: byokEndpoint.error || "Failed to build BYOK endpoint",
      code: 500,
    });
  }

  // const finalEndpoints = [byokEndpoint.data, ...endpoints]; // Do this when we have Passthrough Billing
  const finalEndpoints = [byokEndpoint.data];

  for (const endpoint of finalEndpoints) {
    const result = await sendRequest(
      endpoint,
      parsedBody,
      requestWrapper,
      providerKey,
      forwarder
    );

    if (!isErr(result)) {
      return result;
    }
  }

  return err({
    type: "request_failed",
    message: "All models failed",
    code: 500,
  });
};

const attemptProvidersRequest = async (
  modelName: string,
  providersEndpoint: EndpointsProviderEndpoint,
  requestWrapper: RequestWrapper,
  forwarder: (targetBaseUrl: string | null) => Promise<Response>,
  providerKeysManager: ProviderKeysManager,
  orgId: string,
  parsedBody: any
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
      },
      requestWrapper,
      forwarder,
      providerKeysManager,
      orgId,
      parsedBody
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
}: {
  model: string;
  requestWrapper: RequestWrapper;
  forwarder: (targetBaseUrl: string | null) => Promise<Response>;
  providerKeysManager: ProviderKeysManager;
  orgId: string;
  parsedBody: any;
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
      parsedBody
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
    parsedBody
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
}: {
  models: string[];
  requestWrapper: RequestWrapper;
  forwarder: (targetBaseUrl: string | null) => Promise<Response>;
  providerKeysManager: ProviderKeysManager;
  promptManager: PromptManager;
  orgId: string;
  parsedBody: any;
}): Promise<Result<Response, Error>> => {
  if (models.length === 0) {
    return err({
      type: "invalid_format",
      message: "No models provided",
      code: 400,
    });
  }

  if (parsedBody.prompt_id || parsedBody.environment || parsedBody.version_id || parsedBody.inputs) {
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
