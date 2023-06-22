import { Env } from ".";
import { handleFeedbackEndpoint } from "./feedback";
import { proxyForwarder } from "./lib/HeliconeProxyRequest/forwarder";
import { RequestWrapper } from "./lib/RequestWrapper";
import { handleLoggingEndpoint } from "./properties";
import { Router, IRequest } from "itty-router";

const router = Router<IRequest, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]>();
//api.hconeai.com/v1

router.post("/v1/log", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
  return await handleLoggingEndpoint(
    requestWrapper,
    env
  );
});

router.post("/v1/feedback", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
  return await handleFeedbackEndpoint(
    requestWrapper,
    env
  );
});

// Proxy only + proxy forwarder
router.all("*", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
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

  return await proxyForwarder(
    requestWrapper,
    env,
    ctx
  );
});

export default router;
