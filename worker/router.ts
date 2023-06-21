import { RequestContext } from "./src";
import { handleFeedbackEndpoint } from "./src/feedback";
import { proxyForwarder } from "./src/lib/HeliconeProxyRequest/forwarder";
import { handleLoggingEndpoint } from "./src/properties";
import { Router } from "itty-router";

const router = Router<RequestContext>();

router.post("/v1/log", async (requestContext) => {
  return await handleLoggingEndpoint(
    requestContext.requestWrapper,
    requestContext.env
  );
});

router.post("/v1/feedback", async (requestContext) => {
  return await handleFeedbackEndpoint(
    requestContext.requestWrapper,
    requestContext.env
  );
});

// Proxy only + proxy forwarder
router.all("*", async (requestContext) => {
  if (requestContext.requestWrapper.url.pathname.includes("audio")) {
    const requestWrapper = requestContext.requestWrapper;
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
    requestContext.requestWrapper,
    requestContext.env,
    requestContext.ctx
  );
});

export default router;
