import { azurePattern } from "@helicone-package/cost/providers/mappings";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";

export const getOpenAIProxyRouter = (router: BaseRouter) => {
  router.post(
    "/v1/files*",
    async (
      request: Request,
      _: RequestWrapper,
      __: Env,
      ___: ExecutionContext
    ) => {
      const originalUrl = new URL(request.url);
      const new_url = `https://api.openai.com${originalUrl.pathname}${originalUrl.search}`;

      const headers = new Headers(request.headers);

      return await fetch(new_url, {
        method: request.method,
        headers: headers,
        body: request.body,
        // @ts-ignore - duplex is needed for streaming bodies
        duplex: 'half',
      });
    }
  );

  // Direct passthrough for file deletes (v1/files)
  router.delete(
    "/v1/files*",
    async (
      request: Request,
      _: RequestWrapper,
      __: Env,
      ___: ExecutionContext
    ) => {
      const originalUrl = new URL(request.url);
      const new_url = `https://api.openai.com${originalUrl.pathname}${originalUrl.search}`;
      const headers = new Headers(request.headers);

      return await fetch(new_url, {
        method: request.method,
        headers: headers,
        body: request.body,
        // @ts-ignore - duplex is needed for streaming bodies
        duplex: 'half',
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
        const new_url = new URL(
          `https://api.openai.com${requestWrapper.url.pathname}`
        );
        return await fetch(new_url.href, {
          method: requestWrapper.getMethod(),
          headers: requestWrapper.getHeaders(),
          body: requestWrapper.getBody(),
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
