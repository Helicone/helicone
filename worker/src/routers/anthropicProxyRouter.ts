import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";

export const getAnthropicProxyRouter = (router: BaseRouter) => {
  // Direct passthrough for file uploads (v1/files)
  router.post(
    "/v1/files*",
    async (
      request: Request,
      _: RequestWrapper,
      __: Env,
      ___: ExecutionContext
    ) => {
      const originalUrl = new URL(request.url);
      const new_url = `https://api.anthropic.com${originalUrl.pathname}${originalUrl.search}`;

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
      const new_url = `https://api.anthropic.com${originalUrl.pathname}${originalUrl.search}`;
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

  // proxy forwarder only
  router.all(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      return await proxyForwarder(requestWrapper, env, ctx, "ANTHROPIC");
    }
  );

  return router;
};
