import { Env, Provider } from "..";
import { toAnthropic } from "../lib/clients/llmmapper/providers/openai/request/toAnthropic";
import { OpenAIRequestBody } from "../lib/clients/llmmapper/providers/openai/request/types";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
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
  if (provider === "AWS") {
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

const authenticateRequest = async (
  requestWrapper: RequestWrapper,
  providerKey: ProviderKey,
  model: string,
  body: string
) => {
  requestWrapper.setHeader(
    "Helicone-Auth",
    requestWrapper.getAuthorization() ?? ""
  );
  // TODO: need to do some extra bs here for bedrock
  // requestWrapper.setProviderAuthKey(providerKey.decrypted_provider_key);
  if (providerKey.provider === "AWS") {
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
      // requestWrapper.setHeader(
      //   "Authorization",
      //   `Bearer ${providerKey.decrypted_provider_key}`
      // );
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
      // Only copy over the essential headers
      // newHeaders.set("host", forwardToHost);
      // newHeaders.set("content-type", "application/json");

      // Add model override header if model was found
      // if (model) {
      //   requestWrapper.heliconeHeaders.setModelOverride(model);
      // }

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

  requestWrapper.setHeader(
    "Authorization",
    `Bearer ${providerKey.decrypted_provider_key}`
  );
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
      // hacky solution for now just to see if everything works
      const body = await getBody(requestWrapper);

      function tryJSONParse(body: string): OpenAIRequestBody | null {
        try {
          return JSON.parse(body);
        } catch (e) {
          return null;
        }
      }

      const parsedBody = tryJSONParse(body ?? "{}");

      if (!parsedBody) {
        return new Response("Invalid body", { status: 400 });
      }

      const modelParts = parsedBody.model.split("/");
      if (modelParts.length !== 2) {
        return new Response("Invalid model format", { status: 400 });
      }
      const [model, inferenceProvider] = modelParts;
      const provider = getProviderFromProviderName(inferenceProvider);
      if (!provider) {
        return new Response("Invalid inference provider", { status: 400 });
      }

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
      const providerKey = await providerKeysManager.getProviderKey(
        provider,
        orgId
      );
      if (!providerKey) {
        return new Response("Invalid provider key", { status: 401 });
      }

      let finalBody;
      if (model.includes("claude-")) {
        const anthropicBody = toAnthropic(parsedBody);
        const updatedBody = {
          ...anthropicBody,
          ...(provider === "AWS"
            ? { anthropic_version: "bedrock-2023-05-31", model: undefined }
            : { model: model }),
        };
        requestWrapper.setBody(JSON.stringify(updatedBody));
        finalBody = updatedBody;
      } else {
        const updatedBody = {
          ...parsedBody,
          model: model,
        };
        requestWrapper.setBody(JSON.stringify(updatedBody));
        finalBody = updatedBody;
      }

      authenticateRequest(
        requestWrapper,
        providerKey,
        model,
        JSON.stringify(finalBody)
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

      const targetBaseUrl = getForwardUrl(
        provider,
        provider === "AWS"
          ? {
              region:
                (providerKey.config as { region?: string })?.region ??
                "us-west-1",
              model: model,
            }
          : undefined
      );
      return await forwarder(targetBaseUrl);
      // return await proxyForwarder(requestWrapper, env, ctx, provider);
    }
  );

  return router;
};
