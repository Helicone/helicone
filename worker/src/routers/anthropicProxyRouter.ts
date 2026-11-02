import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
import { directProviderPassthrough } from "../lib/HeliconeProxyRequest/directPassthrough";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";

export const getAnthropicProxyRouter = (router: BaseRouter) => {
  // Direct passthrough for file uploads (v1/files)
  router.post(
    "/v1/files*",
    async (
      request: Request,
      requestWrapper: RequestWrapper,
      __: Env,
      ___: ExecutionContext
    ) => {
      return await directProviderPassthrough({
        origin: "https://api.anthropic.com",
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
        origin: "https://api.anthropic.com",
        requestWrapper,
        method: request.method,
        body: request.body,
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
