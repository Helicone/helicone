import { Env, Provider } from "..";

import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";
import { providers } from "../packages/cost/providers/mappings";
import { APIKeysManager } from "../lib/managers/APIKeysManager";
import { APIKeysStore } from "../lib/db/APIKeysStore";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../supabase/database.types";
import { ProviderKeysManager } from "../lib/managers/ProviderKeysManager";
import { ProviderKey, ProviderKeysStore } from "../lib/db/ProviderKeysStore";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import { gatewayForwarder } from "./gatewayRouter";
import { toAnthropic } from "../lib/clients/llmmapper/providers/openai/request/toAnthropic";
import { HeliconeHeaders } from "../lib/models/HeliconeHeaders";

const getBody = async (requestWrapper: RequestWrapper) => {
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

const getProviderFromProviderName = (provider: string) => {
  return providers.find(
    (p) => p.provider.toLowerCase() === provider.toLowerCase()
  )?.provider;
};

const getForwardUrl = (
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
type LLMRequestBody = {
  model: string;
} & Record<string, any>;

const authenticateRequest = async (
  requestWrapper: RequestWrapper,
  providerKey: ProviderKey,
  model: string,
  body: string
) => {
  requestWrapper.resetObject();
  requestWrapper.setHeader(
    "Helicone-Auth",
    requestWrapper.getAuthorization() ?? ""
  );
  if (providerKey.provider === "BEDROCK") {
    if (providerKey.auth_type === "key") {
      const awsAccessKey = providerKey.decrypted_provider_key;
      const awsSecretKey = providerKey.decrypted_provider_secret_key;
      const config = providerKey.config as
        | { region?: string }
        | null
        | undefined;
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
    } else if (providerKey.auth_type === "session_token") {
      // TODO: manage session token based auth for aws bedrock
    }
  }

  if (providerKey.provider === "ANTHROPIC") {
    requestWrapper.setHeader("x-api-key", providerKey.decrypted_provider_key);
  } else {
    requestWrapper.setHeader(
      "Authorization",
      `Bearer ${providerKey.decrypted_provider_key}`
    );
  }
};

interface ModelAttempt {
  model: string;
  provider: Provider;
  providerKey: ProviderKey;
  body: string;
}

interface AttemptResult {
  success: boolean;
  response?: Response;
  error?: string;
}

const parseModelOption = (
  modelOption: string
): { model: string; provider: Provider } | null => {
  const modelParts = modelOption.split("/");
  if (modelParts.length !== 2) {
    return null;
  }

  const [model, inferenceProvider] = modelParts;
  const provider = getProviderFromProviderName(inferenceProvider);

  if (!provider) {
    return null;
  }

  return { model, provider };
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

const attemptModelRequest = async (
  modelAttempt: ModelAttempt,
  requestWrapper: RequestWrapper,
  forwarder: (targetBaseUrl: string | null) => Promise<Response>
): Promise<AttemptResult> => {
  const { model, provider, providerKey, body } = modelAttempt;

  // Reset request wrapper state for retry
  requestWrapper.setBody(body);

  await authenticateRequest(requestWrapper, providerKey, model, body);

  const targetBaseUrl = getForwardUrl(
    provider,
    provider === "BEDROCK"
      ? {
          region:
            (providerKey.config as { region?: string })?.region ?? "us-west-1",
          model: model,
        }
      : undefined
  );

  try {
    const response = await forwarder(targetBaseUrl);

    if (response.ok) {
      return { success: true, response };
    }

    return {
      success: false,
      error: `${model}/${provider}: ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      error: `${model}/${provider}: ${error}`,
    };
  }
};

export const getAIGatewayRouter = (router: BaseRouter) => {
  // proxy forwarder only
  router.all(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      const body = await getBody(requestWrapper);

      function tryJSONParse(body: string): LLMRequestBody | null {
        try {
          return JSON.parse(body);
        } catch (e) {
          return null;
        }
      }

      const parsedBody = tryJSONParse(body ?? "{}");

      if (!parsedBody || !parsedBody.model) {
        return new Response("Invalid body or missing model", { status: 400 });
      }

      // Parse comma-separated models as fallback options
      const modelOptions = parsedBody.model.split(",").map((m) => m.trim());

      const hashedKey = await requestWrapper.getProviderAuthHeader();
      const isEU = requestWrapper.isEU();
      const supabaseClient = isEU
        ? createClient<Database>(
            env.EU_SUPABASE_URL,
            env.EU_SUPABASE_SERVICE_ROLE_KEY
          )
        : createClient<Database>(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY
          );
      const apiKeyManager = new APIKeysManager(
        new APIKeysStore(supabaseClient),
        env
      );
      const orgId = await apiKeyManager.getAPIKeyWithFetch(hashedKey ?? "");
      if (!orgId) {
        return new Response("Invalid API key", { status: 401 });
      }
      const providerKeysManager = new ProviderKeysManager(
        new ProviderKeysStore(supabaseClient),
        env
      );

      function forwarder(targetBaseUrl: string | null) {
        return gatewayForwarder(
          {
            targetBaseUrl,
            setBaseURLOverride: (url) => {
              requestWrapper.setBaseURLOverride(url);
            },
          },
          requestWrapper,
          env,
          ctx
        );
      }

      // Try each model option sequentially until one succeeds
      const failedAttempts: string[] = [];

      for (const modelOption of modelOptions) {
        const parsed = parseModelOption(modelOption);
        if (!parsed) {
          failedAttempts.push(`Invalid model format: ${modelOption}`);
          continue;
        }

        const { model, provider } = parsed;
        const providerKey = await providerKeysManager.getProviderKeyWithFetch(
          provider,
          orgId
        );

        if (!providerKey) {
          failedAttempts.push(`Invalid provider key for ${provider}`);
          continue;
        }

        const body = prepareRequestBody(
          parsedBody,
          model,
          provider,
          requestWrapper.heliconeHeaders
        );
        const attempt = { model, provider, providerKey, body };

        const result = await attemptModelRequest(
          attempt,
          requestWrapper,
          forwarder
        );

        if (result.success && result.response) {
          return result.response;
        }

        if (result.error) {
          failedAttempts.push(result.error);
        }
      }

      const errorMessage =
        failedAttempts.length > 0
          ? `All model attempts failed:\n${failedAttempts.join("\n")}`
          : "No valid model configurations could be processed";

      return new Response(errorMessage, { status: 500 });
    }
  );

  return router;
};
