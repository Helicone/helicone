import { handleFeedbackEndpoint } from "./feedback";
import { proxyForwarder } from "./lib/HeliconeProxyRequest/forwarder";

import { RequestHandlerType, RequestWrapper } from "./lib/RequestWrapper";
import { handleLoggingEndpoint } from "./properties";

export interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
  TOKENIZER_COUNT_API: string;
  RATE_LIMIT_KV: KVNamespace;
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  PROVIDER: "OPENAI" | "ANTHROPIC";
}

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

type Dispatcher = (
  request: RequestWrapper,
  env: Env,
  ctx: ExecutionContext
) => Promise<Response>;

const dispatcherMap: {
  [key in RequestHandlerType]: Dispatcher;
} = {
  feedback: handleFeedbackEndpoint,
  logging: handleLoggingEndpoint,
  proxy_only: async (request: RequestWrapper) => {
    const new_url = new URL(`https://api.openai.com${request.url.pathname}`);
    return await fetch(new_url.href, {
      method: request.getMethod(),
      headers: request.getHeaders(),
      body: request.getBody(),
    });
  },
  proxy_log: proxyForwarder,
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const wrappedRequest = new RequestWrapper(request);
      const requestHandlerType = wrappedRequest.getRequestHandlerType();
      const handler = dispatcherMap[requestHandlerType];
      return await handler(wrappedRequest, env, ctx);
    } catch (e) {
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
  },
};
