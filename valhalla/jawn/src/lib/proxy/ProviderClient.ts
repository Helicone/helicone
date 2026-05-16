import retry from "async-retry";
import { HeliconeProxyRequest, RetryOptions } from "./HeliconeProxyRequest";
import fetch from "node-fetch";
import { Headers, Response } from "node-fetch";
export interface CallProps {
  headers: Headers;
  method: string;
  apiBase: string;
  body: string | null;
  increaseTimeout: boolean;
  originalUrl: URL;
}

export function callPropsFromProxyRequest(
  proxyRequest: HeliconeProxyRequest
): CallProps {
  return {
    apiBase: proxyRequest.api_base,
    body: proxyRequest.bodyText,
    headers: proxyRequest.requestWrapper.getHeaders(),
    method: proxyRequest.requestWrapper.getMethod(),
    increaseTimeout:
      proxyRequest.requestWrapper.heliconeHeaders.featureFlags.increaseTimeout,
    originalUrl: proxyRequest.requestWrapper.url,
  };
}

function removeHeliconeHeaders(request: Headers): Headers {
  const newHeaders = new Headers();
  for (const [key, value] of request.entries()) {
    if (
      !key.toLowerCase().startsWith("helicone-") &&
      key.toLowerCase() !== "content-length"
    ) {
      newHeaders.set(key, value);
    }
  }
  return newHeaders;
}

export async function callProvider(props: CallProps) {
  const { headers, method, apiBase, body, increaseTimeout, originalUrl } =
    props;

  const targetUrl = buildTargetUrl(originalUrl, apiBase);

  const finalHeaders = removeHeliconeHeaders(headers);
  const baseInit = { method, headers: finalHeaders };
  const init =
    method === "GET" ? { ...baseInit } : { ...baseInit, body: body ?? "" };
  init.headers.delete("host");
  init.headers.delete("Content-Encoding");

  const result = await fetch(targetUrl.href, init);
  result.headers.delete("Content-Encoding");
  return result;
}

export function buildTargetUrl(originalUrl: URL, apiBase: string): URL {
  const apiBaseUrl = new URL(apiBase.replace(/\/$/, ""));
  const pathname = originalUrl.pathname.replace(
    /^\/v1\/gateway(\/[^\/]+)?/,
    ""
  );

  return new URL(`${apiBaseUrl.origin}${pathname}${originalUrl.search}`);
}

// Hard cap so a hostile or misconfigured provider cannot make the proxy wait
// for an unbounded amount of time before retrying.
const MAX_RETRY_AFTER_MS = 60_000;

/**
 * Parse an RFC 7231 `Retry-After` header value into milliseconds.
 *
 * Accepts either a non-negative integer number of seconds or an HTTP-date.
 * Returns `null` when the header is absent, malformed, or already in the past
 * — in which case the caller should fall back to its default backoff strategy.
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
          // Throw an error if the status code is 429
          if (res.status === 429 || res.status === 500 || res.status === 522) {
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
