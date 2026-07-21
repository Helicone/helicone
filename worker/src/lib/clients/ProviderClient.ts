import {
  HeliconeProxyRequest,
  RetryOptions,
} from "../models/HeliconeProxyRequest";
import retry from "async-retry";
import { llmmapper } from "./llmmapper/llmmapper";
import { ValidRequestBody } from "../../RequestBodyBuffer/IRequestBodyBuffer";

export interface CallProps {
  headers: Headers;
  method: string;
  apiBase: string;
  body: ValidRequestBody;
  increaseTimeout: boolean;
  originalUrl: URL;
  extraHeaders: Headers | null;
  env: Env;
}

export function callPropsFromProxyRequest(
  proxyRequest: HeliconeProxyRequest
): CallProps {
  return {
    apiBase: proxyRequest.api_base,
    body: proxyRequest.body,
    headers: proxyRequest.requestWrapper.getHeaders(),
    method: proxyRequest.requestWrapper.getMethod(),
    increaseTimeout:
      proxyRequest.requestWrapper.heliconeHeaders.featureFlags.increaseTimeout,
    originalUrl: proxyRequest.requestWrapper.url,
    extraHeaders: proxyRequest.requestWrapper.extraHeaders,
    env: proxyRequest.env,
  };
}

function removeHeliconeHeaders(
  request: Headers,
  removeAuth: boolean = false
): Headers {
  const newHeaders = new Headers();
  for (const [key, value] of request.entries()) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith("helicone-")) {
      continue;
    }
    // Remove Authorization header if requested (for URL-based auth providers)
    if (removeAuth && lowerKey === "authorization") {
      continue;
    }
    newHeaders.set(key, value);
  }
  return newHeaders;
}

function joinHeaders(h1: Headers, h2: Headers): Headers {
  const newHeaders = new Headers();
  for (const [key, value] of h1.entries()) {
    newHeaders.set(key, value);
  }
  for (const [key, value] of h2.entries()) {
    newHeaders.set(key, value);
  }
  return newHeaders;
}

async function callWithMapper(
  targetUrl: URL,
  init:
    | {
        method: string;
        headers: Headers;
      }
    | {
        body: string;
        method: string;
        headers: Headers;
      }
): Promise<Response> {
  if (targetUrl.host === "gateway.llmmapper.com") {
    try {
      if ("body" in init) {
        const headers: Record<string, string> = {};
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return await llmmapper(targetUrl, {
          body: init.body,
          headers: headers,
        });
      } else {
        return new Response("Unsupported, must have body", { status: 404 });
      }
    } catch (e) {
      return new Response(
        "Helicone LLMMapper gateway error" + JSON.stringify(e),
        {
          status: 10_502,
        }
      );
    }
  } else {
    return await fetch(targetUrl.href, init);
  }
}

export async function callProvider(props: CallProps): Promise<Response> {
  const { headers, method, apiBase, body, increaseTimeout, originalUrl, env } =
    props;

  const mockResponseHeader = headers.get("__helicone-mock-response");
  if (mockResponseHeader) {
    // temporarily remove for load testing
    // if (env.ENVIRONMENT === "production") {
    // return new Response("Mock responses not allowed in production", {
    //   status: 403,
    // });
    // }

    try {
      const mockResponseBody = JSON.parse(mockResponseHeader);
      return new Response(JSON.stringify(mockResponseBody), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Invalid mock response format",
          message:
            "The __helicone-mock-response header must contain valid JSON",
          details: e instanceof Error ? e.message : String(e),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  const targetUrl = buildTargetUrl(originalUrl, apiBase);

  const removedHeaders = removeHeliconeHeaders(headers);

  let headersWithExtra = removedHeaders;
  if (props.extraHeaders) {
    headersWithExtra = joinHeaders(removedHeaders, props.extraHeaders);
  }

  if (
    originalUrl.host.includes("localhost") ||
    originalUrl.host.includes("127.0.0.1")
  ) {
    headersWithExtra.set("Accept-Encoding", "Identity");
  }

  const baseInit = { method, headers: headersWithExtra };
  const init = method === "GET" ? { ...baseInit } : { ...baseInit, body };

  let response: Response;
  if (increaseTimeout) {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => controller.abort(), 1000 * 60 * 30);
    response = await fetch(targetUrl.href, {
      ...init,
      signal,
    });
  } else {
    response = await callWithMapper(targetUrl, init);
  }
  return response;
}

export function buildTargetUrl(originalUrl: URL, apiBase: string): URL {
  const apiBaseUrl = new URL(apiBase.replace(/\/$/, ""));

  return new URL(
    `${apiBaseUrl.origin}${originalUrl.pathname}${originalUrl.search}`
  );
}

// Hard cap so a hostile or misconfigured provider cannot make the proxy wait
// for an unbounded amount of time before retrying.
const MAX_RETRY_AFTER_MS = 60_000;

/**
 * Parse an RFC 7231 `Retry-After` header value into milliseconds.
 *
 * Accepts either a non-negative integer number of seconds or an HTTP-date.
 * Returns `null` when the header is absent, malformed, or already in the past.
 * In that case the caller should fall back to its default backoff strategy.
 * The returned value is clamped to {@link MAX_RETRY_AFTER_MS} to prevent abuse.
 */
export function parseRetryAfter(
  value: string | null | undefined,
  now: number = Date.now()
): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;

  // delta-seconds form (RFC 7231 §7.1.3 first alternative)
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number.parseInt(trimmed, 10);
    if (Number.isNaN(seconds) || seconds < 0) return null;
    return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
  }

  // HTTP-date form (RFC 7231 §7.1.3 second alternative)
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return null;
  const delta = date - now;
  if (delta <= 0) return null;
  return Math.min(delta, MAX_RETRY_AFTER_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callProviderWithRetry(
  callProps: CallProps,
  retryOptions: RetryOptions
): Promise<Response> {
  let lastResponse;

  try {
    // Use async-retry to call the forwardRequestToOpenAi function with exponential backoff
    await retry(
      async (bail, attempt) => {
        try {
          const res = await callProvider(callProps);

          lastResponse = res;
          // Throw an error if the status code is 429 or 5xx
          if (res.status === 429 || (res.status < 600 && res.status >= 500)) {
            // For 429 the provider can explicitly tell us how long to wait via
            // the Retry-After header. Honour it as a minimum delay before the
            // next retry kicks in; async-retry's exponential backoff still
            // applies on top, so this only ever lengthens the wait.
            if (res.status === 429) {
              const retryAfterMs = parseRetryAfter(
                res.headers.get("retry-after")
              );
              if (retryAfterMs !== null && retryAfterMs > 0) {
                await sleep(retryAfterMs);
              }
            }
            throw new Error(`Status code ${res.status}`);
          }
          return res;
        } catch (e) {
          // If we reach the maximum number of retries, bail with the error
          if (attempt >= retryOptions.retries) {
            bail(e as Error);
          }
          // Otherwise, retry with exponential backoff
          throw e;
        }
      },
      {
        ...retryOptions,
        onRetry: (error, attempt) => {
          console.log(`Retry attempt ${attempt}. Error: ${error}`);
        },
      }
    );
  } catch (e) {
    console.warn(
      `Retried ${retryOptions.retries} times but still failed. Error: ${e}`
    );
  }

  if (lastResponse === undefined) {
    throw new Error("500 An error occured while retrying your requests");
  }

  return lastResponse;
}
