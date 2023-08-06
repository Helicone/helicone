import { IRequest, Router } from "itty-router";
import { Env } from "..";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/forwarder";
import { RequestWrapper } from "../lib/RequestWrapper";

export const getOpenAIProxyRouter = () => {
  const oaiRouter = Router<
    IRequest,
    [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
  >();
  // Proxy only + proxy forwarder
  oaiRouter.get(
    "/helicone/test",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
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

  oaiRouter.all(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      console.log("requestWrapper.url.pathname", requestWrapper.url.pathname);
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

      return await proxyForwarder(requestWrapper, env, ctx, "OPENAI");
    }
  );

  return oaiRouter;
};
