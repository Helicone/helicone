import { azurePattern } from "@helicone-package/cost/providers/mappings";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
import { directProviderPassthrough } from "../lib/HeliconeProxyRequest/directPassthrough";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";

export const getOpenAIProxyRouter = (router: BaseRouter) => {
  router.post(
    "/v1/files*",
    async (
      request: Request,
      requestWrapper: RequestWrapper,
      __: Env,
      ___: ExecutionContext
    ) => {
      return await directProviderPassthrough({
        origin: "https://api.openai.com",
        requestWrapper,
        method: request.method,
        body: request.body,
      });
    }
  );

  // Direct passthrough for file deletes (v1/files)
  router.delete(
    "/v1/files*",
    async (
      request: Request,
      requestWrapper: RequestWrapper,
      __: Env,
      ___: ExecutionContext
    ) => {
      return await directProviderPassthrough({
        origin: "https://api.openai.com",
        requestWrapper,
        method: request.method,
        body: request.body,
      });
    }
  );
  
  router.get(
    "/helicone/test",
    async (
      _,
      requestWrapper: RequestWrapper,
      _env: Env,
      _ctx: ExecutionContext
    ) => {
      const properties = requestWrapper.heliconeHeaders.heliconeProperties;
      return new Response(
        JSON.stringify({
          test: "Hello World!",
          properties: {
            ...properties,
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }
  );

  router.all(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      if (requestWrapper.url.pathname.includes("audio")) {
        return await directProviderPassthrough({
          origin: "https://api.openai.com",
          requestWrapper,
          method: requestWrapper.getMethod(),
          body: requestWrapper.getBody(),
          includeSearch: false,
        });
      }

      if (
        requestWrapper.heliconeHeaders.openaiBaseUrl &&
        azurePattern.test(requestWrapper.heliconeHeaders.openaiBaseUrl)
      ) {
        return await proxyForwarder(requestWrapper, env, ctx, "AZURE");
      } else {
        return await proxyForwarder(requestWrapper, env, ctx, "OPENAI");
      }
    }
  );

  return router;
};
