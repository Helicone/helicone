import express, {
  Request as ExpressRequest,
  Response as ExpressResponse,
  RequestHandler,
} from "express";
import fetch, { Response } from "node-fetch";
import { Readable as NodeReadableStream } from "stream";
import { proxyForwarder } from "../../lib/proxy/ProxyForwarder";
import { webSocketProxyForwarder } from "../../lib/proxy/WebSocketProxyForwarder";
import { RequestWrapper } from "../../lib/requestWrapper/requestWrapper";
import { Provider } from "@helicone-package/llm-mapper/types";
import { providers } from "@helicone-package/cost/providers/mappings";

export const proxyRouter = express.Router();
proxyRouter.use(express.json());

export interface ProxyRequestBody {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

/* -------------------------------------------------------------------------- */
/*                                /:provider/*                                */
/* -------------------------------------------------------------------------- */
proxyRouter.post("/v1/gateway/:provider/{*path}", (async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { provider } = req.params;

  const { data: requestWrapper, error: requestWrapperErr } =
    await RequestWrapper.create(req);
  if (requestWrapperErr || !requestWrapper) {
    return res.status(500).json({ message: "Error creating request wrapper" });
  }

  const routerFunction = ROUTER_MAP[provider.toUpperCase()];

  if (routerFunction) {
    const response: Response = await routerFunction(
      { data: requestWrapper, error: requestWrapperErr }.data
    );

    res.status(response.status);

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // TODO we need to pipe the response body to res. but the response body is a ReadableStream or a Buffer or a string
    const responseBody = response.body;

    if (responseBody instanceof NodeReadableStream) {
      // Pipe ReadableStream to the response
      responseBody.pipe(res);
    } else if (Buffer.isBuffer(responseBody)) {
      // Write Buffer to the response
      res.end(responseBody);
    } else if (typeof responseBody === "string") {
      // Write string to the response
      res.end(responseBody);
    } else {
      try {
        const text = await response.text();
        if (text) {
          res.end(text);
        } else {
          res.status(500).json({ message: "Unsupported response body type" });
        }
      } catch (e) {
        res.status(500).json({ message: "Unsupported response body type" });
      }
    }
  } else {
    res.status(400).json({ message: "Invalid provider" });
  }
}) as RequestHandler);

/* -------------------------------------------------------------------------- */
/*                                /* (Error)                                  */
/* -------------------------------------------------------------------------- */
proxyRouter.post(
  "/v1/gateway/{*path}",
  async (req: ExpressRequest, res: ExpressResponse) => {
    throw new Error("Not implemented");
    //   const { data: requestWrapper, error: requestWrapperErr } =
    //     await RequestWrapper.create(req);
    //   if (requestWrapperErr || !requestWrapper) {
    //     return res.status(500).json({ message: "Error creating request wrapper" });
    //   }

    //   const routerFunction = ROUTER_MAP["GATEWAY"];

    //   if (routerFunction) {
    //     routerFunction(
    //       { data: requestWrapper, error: requestWrapperErr }.data,
    //       res
    //     );
    //   } else {
    //     res.status(400).json({ message: "Invalid provider" });
    //   }
  }
);

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Resolves the upstream {@link Provider} that matches the supplied target
 * base URL by scanning the registered provider patterns
 * (`@helicone-package/cost/providers/mappings`). Falls back to `"CUSTOM"`
 * when no pattern matches so logs are still attributed instead of being
 * dropped.
 */
export function getProviderFromTargetUrl(targetBaseUrl: string): Provider {
  const lower = targetBaseUrl.toLowerCase();
  const match = providers.find((provider) => provider.pattern.test(lower));
  return match ? (match.provider as Provider) : "CUSTOM";
}

const handleAnthropicProxy = async (requestWrapper: RequestWrapper) => {
  return await proxyForwarder(requestWrapper, "ANTHROPIC");
};

const handleOpenAIProxy = async (requestWrapper: RequestWrapper) => {
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

  return await proxyForwarder(requestWrapper, "OPENAI");
};

const handleGatewayAPIRouter = async (requestWrapper: RequestWrapper) => {
  return new Response("Not implemented", { status: 501 });
};

/**
 * Generic passthrough gateway, for parity with `gateway.helicone.ai` (Cloud).
 *
 * Forwards a request to an arbitrary upstream specified via the
 * `Helicone-Target-URL` header while logging it through the same Kafka/S3
 * pipeline used by the native OpenAI/Anthropic gateways.
 *
 * Convention (mirrors Cloud):
 *   POST /v1/gateway/passthrough/<path>
 *   Helicone-Auth: Bearer <helicone_key>
 *   Helicone-Target-URL: <origin>            (host-only — no path/query/hash)
 *   Authorization: Bearer <upstream_key>     (forwarded to upstream as-is)
 *
 * Example:
 *   POST /v1/gateway/passthrough/api/v1/chat/completions
 *   Helicone-Target-URL: https://openrouter.ai
 *   → upstream: POST https://openrouter.ai/api/v1/chat/completions
 */
export const handlePassthroughProxy = async (
  requestWrapper: RequestWrapper
): Promise<Response> => {
  const targetBaseUrl = requestWrapper.heliconeHeaders.targetBaseUrl;

  if (!targetBaseUrl) {
    return new Response(
      JSON.stringify({
        message:
          "Helicone-Target-URL header is required for /v1/gateway/passthrough/*",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let parsedTargetUrl: URL;
  try {
    parsedTargetUrl = new URL(targetBaseUrl);
  } catch {
    return new Response(
      JSON.stringify({
        message: `Invalid Helicone-Target-URL: "${targetBaseUrl}"`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (parsedTargetUrl.protocol !== "https:" && parsedTargetUrl.protocol !== "http:") {
    return new Response(
      JSON.stringify({
        message: `Helicone-Target-URL must use http(s) scheme, got "${parsedTargetUrl.protocol}"`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (parsedTargetUrl.origin !== targetBaseUrl.replace(/\/$/, "")) {
    return new Response(
      JSON.stringify({
        message: `Helicone-Target-URL "${targetBaseUrl}" must be host-only (origin) without path/query/hash. Append the upstream path to the request URL instead.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Bypass approvedDomains validation: this endpoint is opt-in via an explicit
  // header, mirroring Cloud's gateway behaviour where any HTTPS origin is
  // allowed. Self-hosted operators are responsible for fronting Jawn with
  // their own auth/network policies if they need stricter SSRF controls.
  requestWrapper.setBaseURLOverride(parsedTargetUrl.origin);

  const provider = getProviderFromTargetUrl(parsedTargetUrl.origin);
  return await proxyForwarder(requestWrapper, provider);
};

const ROUTER_MAP: {
  [key: string]: (requestWrapper: RequestWrapper) => Promise<Response>;
} = {
  OAI: handleOpenAIProxy,
  GATEWAY: handleGatewayAPIRouter,
  ANTHROPIC: handleAnthropicProxy,
  PASSTHROUGH: handlePassthroughProxy,
};
