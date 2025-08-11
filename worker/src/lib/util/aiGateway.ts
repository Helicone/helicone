import { Env } from "../..";
import {
  buildEndpointUrl,
  buildModelId,
  getEndpoint,
  getProvider,
  ProviderConfig,
} from "@helicone-package/cost/models";
import { RequestWrapper } from "../RequestWrapper";
import { APIKeysManager } from "../managers/APIKeysManager";
import { APIKeysStore } from "../db/APIKeysStore";
import { err, isErr, ok, Result } from "./results";
import { ProviderKeysManager } from "../managers/ProviderKeysManager";
import { toAnthropic } from "../clients/llmmapper/providers/openai/request/toAnthropic";
import { HeliconeHeaders } from "../models/HeliconeHeaders";
import { ProviderKey } from "../db/ProviderKeysStore";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import { getEndpoints, ModelEndpoint } from "@helicone-package/cost/models";
import providers, {
  ProviderName,
} from "@helicone-package/cost/models/providers";
import { PromptManager } from "../managers/PromptManager";

type Error = {
  type:
    | "invalid_format"
    | "missing_provider_key"
    | "request_failed"
    | "invalid_prompt";
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
  endpoints: ModelEndpoint[];
};

type ValidateModelStringResult = Result<
  DirectProviderEndpoint | EndpointsProviderEndpoint,
  Error
>;

const validateModelString = (model: string): ValidateModelStringResult => {
  const modelParts = model.split("/");
  if (modelParts.length !== 2) {
    const endpoints = getEndpoints(model);
    if (endpoints.length === 0) {
      return err({
        type: "invalid_format",
        message: "Invalid model",
        code: 400,
      });
    }
    return ok({ type: "endpoints", endpoints });
  }

  const [modelName, provider] = [modelParts[0], getProvider(modelParts[1])];

  if (!provider) {
    return err({
      type: "invalid_format",
      message: "Invalid model",
      code: 400,
    });
  }

  return ok({
    type: "direct",
    provider: modelParts[1] as ProviderName,
    modelName,
    providerConfig: provider,
  });
};

const signBedrockRequest = async (
  requestWrapper: RequestWrapper,
  providerKey: ProviderKey,
  model: string,
  body: string
) => {
  const awsAccessKey = providerKey.decrypted_provider_key;
  const awsSecretKey = providerKey.decrypted_provider_secret_key;
  const config = providerKey.config as { region?: string } | null | undefined;
  const awsRegion = config?.region ?? "us-west-1";
  requestWrapper.setUrl(
    `https://bedrock-runtime.${awsRegion}.amazonaws.com/model/${model}/invoke`
  );
  const sigv4 = new SignatureV4({
    service: "bedrock",
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKey ?? "",
      secretAccessKey: awsSecretKey ?? "",
      // ...(awsSessionToken ? { sessionToken: awsSessionToken } : {}),
    },
    sha256: Sha256,
  });

  const headers = new Headers();

  const forwardToHost = "bedrock-runtime." + awsRegion + ".amazonaws.com";

  // Required headers for AWS requests
  headers.set("host", forwardToHost);
  headers.set("content-type", "application/json");

  const url = new URL(requestWrapper.url.toString());
  const request = new HttpRequest({
    method: requestWrapper.getMethod(),
    protocol: url.protocol,
    hostname: forwardToHost,
    path: url.pathname + url.search,
    headers: Object.fromEntries(headers.entries()),
    body,
  });

  const signedRequest = await sigv4.sign(request);

  // Create new headers with the signed values
  const newHeaders = new Headers();

  // Add all the signed AWS headers
  for (const [key, value] of Object.entries(signedRequest.headers)) {
    if (value) {
      newHeaders.set(key, value.toString());
    }
  }
  requestWrapper.remapHeaders(newHeaders);
  return;
};

const authenticateRequest = async (
  requestWrapper: RequestWrapper,
  providerKey: ProviderKey,
  model: string,
  body: string,
  heliconeHeaders: HeliconeHeaders
) => {
  requestWrapper.resetObject();
  requestWrapper.setHeader(
    "Helicone-Auth",
    requestWrapper.getAuthorization() ?? ""
  );
  if (providerKey.provider === "bedrock") {
    if (providerKey.auth_type === "key") {
      await signBedrockRequest(requestWrapper, providerKey, model, body);
      return;
    } else if (providerKey.auth_type === "session_token") {
      // TODO: manage session token based auth for aws bedrock
    }
  }

  if (
    providerKey.provider === "anthropic" &&
    heliconeHeaders.gatewayConfig.bodyMapping === "NO_MAPPING"
  ) {
    requestWrapper.setHeader("x-api-key", providerKey.decrypted_provider_key);
  } else {
    requestWrapper.setHeader(
      "Authorization",
      `Bearer ${providerKey.decrypted_provider_key}`
    );
  }
};

const prepareRequestBody = (
  parsedBody: any,
  model: string,
  provider: ProviderName,
  heliconeHeaders: HeliconeHeaders
): string => {
  if (model.includes("claude-") && provider === "bedrock") {
    const anthropicBody =
      heliconeHeaders.gatewayConfig.bodyMapping === "OPENAI"
        ? toAnthropic(parsedBody)
        : parsedBody;
    const updatedBody = {
      ...anthropicBody,
      ...(provider === "bedrock"
        ? { anthropic_version: "bedrock-2023-05-31", model: undefined }
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

  let endpoint = getEndpoint(modelName, provider);
  const providerModelId =
    (endpoint
      ? buildModelId(endpoint, {
          region:
            (providerKey.config as { region?: string })?.region ?? "us-west-1",
          crossRegion:
            (providerKey.config as { crossRegion?: string })?.crossRegion ===
            "true",
          projectId:
            (providerKey.config as { projectId?: string })?.projectId ??
            undefined,
        })
      : modelName) ?? "";

  if (!endpoint) {
    // backwards compatibility if someone passes the explicit model id used by the provider
    endpoint = {
      providerModelId: modelName,
      provider,
      pricing: {
        prompt: 0,
        completion: 0,
        cacheRead: 0,
        cacheWrite: 0,
      },
      contextLength: 0,
      maxCompletionTokens: 0,
      supportedParameters: [],
    };
  }

  const body = prepareRequestBody(
    parsedBody,
    providerModelId,
    provider,
    requestWrapper.heliconeHeaders
  );

  requestWrapper.setBody(body);
  await authenticateRequest(
    requestWrapper,
    providerKey,
    providerModelId,
    body,
    requestWrapper.heliconeHeaders
  );

  const targetBaseUrl = endpoint
    ? buildEndpointUrl(endpoint, {
        region:
          (providerKey.config as { region?: string })?.region ?? "us-west-1",
        crossRegion:
          (providerKey.config as { crossRegion?: string })?.crossRegion ===
          "true",
        projectId:
          (providerKey.config as { projectId?: string })?.projectId ??
          undefined,
        deploymentName:
          (providerKey.config as { deploymentName?: string })?.deploymentName ??
          undefined,
        resourceName:
          (providerKey.config as { resourceName?: string })?.resourceName ??
          undefined,
      })
    : null;

  if (!targetBaseUrl) {
    return err({
      type: "request_failed",
      message: "Failed to get target base URL",
      code: 500,
    });
  }

  try {
    const response = await forwarder(targetBaseUrl);

    if (response.ok) {
      return ok(response);
    }

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
      message: error instanceof Error ? error.message : "Unknown error",
      code: 500,
    });
  }
};

const attemptEndpointsProviderRequest = async (
  modelName: string,
  endpointsProviderEndpoint: EndpointsProviderEndpoint,
  requestWrapper: RequestWrapper,
  forwarder: (targetBaseUrl: string | null) => Promise<Response>,
  providerKeysManager: ProviderKeysManager,
  orgId: string,
  parsedBody: any
): Promise<Result<Response, Error>> => {
  const { endpoints } = endpointsProviderEndpoint;

  let error: Error | null = null;
  for (const endpoint of endpoints) {
    const provider = getProvider(endpoint.provider);
    if (!provider) {
      continue;
    }

    const result = await attemptDirectProviderRequest(
      {
        type: "direct",
        provider: endpoint.provider as ProviderName,
        modelName,
        providerConfig: provider,
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

  const endpointsProviderRequestResult = await attemptEndpointsProviderRequest(
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
