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
  proxyRequest: HeliconeProxyRequest,
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
    "",
  );

  return new URL(`${apiBaseUrl.origin}${pathname}${originalUrl.search}`);
}

export function retryAfterMs(headers: Headers): number | null {
  const retryAfter = headers.get("retry-after");
  if (retryAfter === null) {
    return null;
  }

  const retryAfterSeconds = Number(retryAfter);
  if (!Number.isNaN(retryAfterSeconds)) {
    return Math.max(0, retryAfterSeconds * 1000);
  }

  const retryAfterDate = Date.parse(retryAfter);
  if (!Number.isNaN(retryAfterDate)) {
    return Math.max(0, retryAfterDate - Date.now());
  }

  return null;
}

export function exponentialDelayMs(
  attempt: number,
  retryOptions: RetryOptions,
): number {
  const baseDelay =
    retryOptions.minTimeout * Math.pow(retryOptions.factor, attempt - 1);

  return Math.min(baseDelay, retryOptions.maxTimeout);
}

export function retryDelayMs(
  attempt: number,
  response: Response,
  retryOptions: RetryOptions,
): number {
  const fallbackDelay = exponentialDelayMs(attempt, retryOptions);
  const providerDelay =
    response.status === 429 ? retryAfterMs(response.headers) : null;

  return Math.max(fallbackDelay, providerDelay ?? 0);
}

export function isRetryableProviderResponse(response: Response): boolean {
  return (
    response.status === 429 ||
    response.status === 500 ||
    response.status === 522
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callProviderWithRetry(
  callProps: CallProps,
  retryOptions: RetryOptions,
): Promise<Response> {
  let lastResponse;

  try {
    for (let attempt = 1; attempt <= retryOptions.retries; attempt++) {
      const res = await callProvider(callProps);

      lastResponse = res;
      if (
        !isRetryableProviderResponse(res) ||
        attempt >= retryOptions.retries
      ) {
        break;
      }

      const delay = retryDelayMs(attempt, res, retryOptions);
      console.log(
        `Retry attempt ${attempt}. Status code: ${res.status}. Waiting ${delay}ms`,
      );
      await sleep(delay);
    }
  } catch (e) {
    console.warn(
      `Retried ${retryOptions.retries} times but still failed. Error: ${e}`,
    );
  }

  if (lastResponse === undefined) {
    throw new Error("500 An error occured while retrying your requests");
  }

  return lastResponse;
}
