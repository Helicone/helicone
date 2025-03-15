import { Env } from "..";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";

export const getVapiProxyRouter = (router: BaseRouter) => {
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
      return await proxyForwarder(requestWrapper, env, ctx, "VAPI");
    }
  );

  return router;
};
