import { Env } from "..";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/forwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { Router, IRequest } from "itty-router";

const oaiRouter = Router<IRequest, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]>();

// Proxy only + proxy forwarder
oaiRouter.all("*", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
  if (requestWrapper.url.pathname.includes("audio")) {
    const new_url = new URL(`https://api.openai.com${requestWrapper.url.pathname}`);
    return await fetch(new_url.href, {
      method: requestWrapper.getMethod(),
      headers: requestWrapper.getHeaders(),
      body: requestWrapper.getBody(),
    });
  }

  return await proxyForwarder(requestWrapper, env, ctx);
});

export default oaiRouter;
