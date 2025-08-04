import { Env, Provider } from "../..";
import { RequestWrapper } from "../RequestWrapper";
import { APIKeysManager } from "../managers/APIKeysManager";
import { APIKeysStore } from "../db/APIKeysStore";
import { providers } from "../../packages/cost/providers/mappings";
import { err, isErr, ok, Result } from "./results";
import { ProviderKeysManager } from "../managers/ProviderKeysManager";
import { toAnthropic } from "../clients/llmmapper/providers/openai/request/toAnthropic";
import { HeliconeHeaders } from "../models/HeliconeHeaders";
import { ProviderKey } from "../db/ProviderKeysStore";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";

type Error = {
  type: "invalid_format" | "missing_provider_key" | "request_failed";
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
  const hashedAPIKey = await requestWrapper.getProviderAuthHeader();
  const orgId = await apiKeyManager.getAPIKeyWithFetch(hashedAPIKey ?? "");

  return orgId;
};

export const getProviderFromProviderName = (provider: string) => {
  return providers.find(
    (p) => p.provider.toLowerCase() === provider.toLowerCase()
  )?.provider;
};

export const getForwardUrl = (
  provider: Provider,
  bedRockConfig?: { region: string; model: string }
) => {
  if (provider === "BEDROCK") {
    // TODO: add support for /converse (should be able to set)
    return `https://bedrock-runtime.${bedRockConfig?.region}.amazonaws.com/model/${bedRockConfig?.model}/invoke`;
  } else if (provider === "OPENAI") {
    return "https://api.openai.com";
  } else if (provider === "ANTHROPIC") {
    return "https://api.anthropic.com";
  } else if (provider === "GROQ") {
    return "https://api.groq.com";
  } else if (provider === "GOOGLE") {
    return "https://generativelanguage.googleapis.com";
  } else if (provider === "MISTRAL") {
    return "https://api.mistral.ai";
  } else if (provider === "DEEPSEEK") {
    return "https://api.deepseek.com";
  } else if (provider === "X") {
    return "https://api.x.ai";
  }
  return null;
};

const validateModelString = (
  model: string
): Result<{ provider: Provider; modelName: string }, Error> => {
  const modelParts = model.split("/");
  if (modelParts.length !== 2) {
    return err({
      type: "invalid_format",
      message: "Invalid model",
      code: 400,
    });
  }

  const [modelName, provider] = [
    modelParts[0],
    getProviderFromProviderName(modelParts[1]),
  ];

  if (!provider) {
    return err({
      type: "invalid_format",
      message: "Invalid model",
      code: 400,
    });
  }

  return ok({ provider, modelName });
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
  console.log("signing bedrock request", awsAccessKey, awsSecretKey);
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
  console.log("signed request", signedRequest);
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
  if (providerKey.provider === "BEDROCK") {
    if (providerKey.auth_type === "key") {
      console.log("signing bedrock request");
      await signBedrockRequest(requestWrapper, providerKey, model, body);
      return;
    } else if (providerKey.auth_type === "session_token") {
      // TODO: manage session token based auth for aws bedrock
    }
  }

  if (
    providerKey.provider === "ANTHROPIC" &&
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
  provider: Provider,
  heliconeHeaders: HeliconeHeaders
): string => {
  if (model.includes("claude-") && provider === "BEDROCK") {
    const anthropicBody =
      heliconeHeaders.gatewayConfig.bodyMapping === "OPENAI"
        ? toAnthropic(parsedBody)
        : parsedBody;
    const updatedBody = {
      ...anthropicBody,
      ...(provider === "BEDROCK"
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

  const { provider, modelName } = result.data;
  const providerKey = await providerKeysManager.getProviderKeyWithFetch(
    provider,
    orgId
  );

  if (!providerKey) {
    return err({
      type: "missing_provider_key",
      message: "Missing provider key",
      code: 400,
    });
  }

  const body = prepareRequestBody(
    parsedBody,
    modelName,
    provider,
    requestWrapper.heliconeHeaders
  );

  requestWrapper.setBody(body);
  await authenticateRequest(
    requestWrapper,
    providerKey,
    modelName,
    body,
    requestWrapper.heliconeHeaders
  );

  const targetBaseUrl = getForwardUrl(
    provider,
    provider === "BEDROCK"
      ? {
          region:
            (providerKey.config as { region?: string })?.region ?? "us-west-1",
          model: modelName,
        }
      : undefined
  );

  try {
    const response = await forwarder(targetBaseUrl);

    if (response.ok) {
      return ok(response);
    }

    const body = await response.json();
    return err({
      type: "request_failed",
      message:
        (body as { message?: string })?.message ??
        (body as { error?: { message?: string } })?.error?.message ??
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

export const attemptModelRequestWithFallback = async ({
  models,
  requestWrapper,
  forwarder,
  providerKeysManager,
  orgId,
  parsedBody,
}: {
  models: string[];
  requestWrapper: RequestWrapper;
  forwarder: (targetBaseUrl: string | null) => Promise<Response>;
  providerKeysManager: ProviderKeysManager;
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
