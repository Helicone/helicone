import { Env } from "..";
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
import { ProviderKeysStore } from "../lib/db/ProviderKeysStore";

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
      const orgId = await apiKeyManager.getAPIKey(hashedKey ?? "");
      console.log("orgId", orgId);
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
      console.log("providerKey", providerKey);
      if (!providerKey) {
        return new Response("Invalid provider key", { status: 401 });
      }
      requestWrapper.setHeader(
        "Helicone-Auth",
        requestWrapper.getAuthorization() ?? ""
      );
      // TODO: need to do some extra bs here for bedrock
      // requestWrapper.setProviderAuthKey(providerKey.decrypted_provider_key);
      requestWrapper.setHeader(
        "Authorization",
        `Bearer ${providerKey.decrypted_provider_key}`
      );

      if (model.includes("claude-")) {
        const anthropicBody = toAnthropic(parsedBody);
        requestWrapper.setBody(JSON.stringify(anthropicBody));
      }

      const updatedBody = {
        ...parsedBody,
        model: model,
      };

      requestWrapper.setBody(JSON.stringify(updatedBody));

      return await proxyForwarder(requestWrapper, env, ctx, provider);
    }
  );

  return router;
};
