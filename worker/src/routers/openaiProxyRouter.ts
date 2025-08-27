import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";

export const getOpenAIProxyRouter = (router: BaseRouter) => {
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
        const new_url = new URL(
          `https://api.openai.com${requestWrapper.url.pathname}`
        );
        const headers = new Headers(requestWrapper.getHeaders());
        headers.set("Accept-Encoding", "identity");
        return await fetch(new_url.href, {
          method: requestWrapper.getMethod(),
          headers: headers,
          body: requestWrapper.getBody(),
        });
      }

      return await proxyForwarder(requestWrapper, env, ctx, "OPENAI");
    }
  );

  return router;
};
