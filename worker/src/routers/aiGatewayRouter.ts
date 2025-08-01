import { Env } from "..";
import { toAnthropic } from "../lib/clients/llmmapper/providers/openai/request/toAnthropic";
import { OpenAIRequestBody } from "../lib/clients/llmmapper/providers/openai/request/types";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";
import { providers } from "../packages/cost/providers/mappings";

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
