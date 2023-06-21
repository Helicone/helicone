import { handleFeedbackEndpoint } from "./feedback";
import { proxyForwarder } from "./lib/HeliconeProxyRequest/forwarder";

import { RequestWrapper } from "./lib/RequestWrapper";
import { handleLoggingEndpoint } from "./properties";
import { Router, IRequest } from "itty-router";

export async function hash(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashedKey = await crypto.subtle.digest(
    { name: "SHA-256" },
    encoder.encode(key)
  );
  const byteArray = Array.from(new Uint8Array(hashedKey));
  const hexCodes = byteArray.map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, "0");
    return paddedHexCode;
  });
  return hexCodes.join("");
}

export interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
  TOKENIZER_COUNT_API: string;
  TOKEN_COUNT_URL: string;
  RATE_LIMIT_KV: KVNamespace;
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  PROVIDER: "OPENAI" | "ANTHROPIC";
  TOKEN_CALC_URL: string;
}

export type RequestContext = {
  requestWrapper: RequestWrapper;
  env: Env;
  ctx: ExecutionContext;
} & IRequest;

const router = Router<RequestContext>();

router.post("/v1/log", async (requestContext) => {
  console.log("/v1/log");
  return await handleLoggingEndpoint(
    requestContext.requestWrapper,
    requestContext.env
  );
});

router.post("/v1/feedback", async (requestContext) => {
  console.log("/v1/feedback");
  return await handleFeedbackEndpoint(
    requestContext.requestWrapper,
    requestContext.env
  );
});

// Proxy only + proxy forwarder
router.all("*", async (requestContext) => {
  console.log("Proxy Only");
  if (requestContext.requestWrapper.url.pathname.includes("audio")) {
    console.log("Audio proxy");
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

  console.log("Proxy forwarder");
  return await proxyForwarder(
    requestContext.requestWrapper,
    requestContext.env,
    requestContext.ctx
  );
});

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const requestWrapper = new RequestWrapper(request);

      const requestContext = request as RequestContext;
      requestContext.requestWrapper = requestWrapper;
      requestContext.env = env;
      requestContext.ctx = ctx;

      return router.handle(requestContext).catch(handleError);
    } catch (e) {
      return handleError(e);
    }
  },
};

function handleError(e: any): Response {
  console.error(e);
  return new Response(
    JSON.stringify({
      "helicone-message":
        "Helicone ran into an error servicing your request: " + e,
      support:
        "Please reach out on our discord or email us at help@helicone.ai, we'd love to help!",
      "helicone-error": JSON.stringify(e),
    }),
    {
      status: 500,
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "helicone-error": "true",
      },
    }
  );
}
