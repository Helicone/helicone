import {
  HeliconeProxyRequest,
  RetryOptions,
} from "../models/HeliconeProxyRequest";
import retry from "async-retry";
import { llmmapper } from "./llmmapper/llmmapper";

export interface CallProps {
  headers: Headers;
  method: string;
  apiBase: string;
  body: string | null;
  increaseTimeout: boolean;
  originalUrl: URL;
  extraHeaders: Headers | null;
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
    extraHeaders: proxyRequest.requestWrapper.extraHeaders,
  };
}

function removeHeliconeHeaders(request: Headers): Headers {
  const newHeaders = new Headers();
  for (const [key, value] of request.entries()) {
    if (!key.toLowerCase().startsWith("helicone-")) {
      newHeaders.set(key, value);
    }
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
) {
  if (targetUrl.host === "gateway.llmmapper.com") {
    if ("body" in init) {
      const headers: Record<string, string> = {};
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
      const result = await llmmapper(targetUrl, {
        body: init.body,
        headers: headers,
      });
      return new Response(result.body ?? "", {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
      });
    } else {
      return new Response("Unsupported, must have body", { status: 404 });
    }
  }
  return await fetch(targetUrl.href, init);
}

export async function callProvider(props: CallProps): Promise<Response> {
  const { headers, method, apiBase, body, increaseTimeout, originalUrl } =
    props;

  const targetUrl = buildTargetUrl(originalUrl, apiBase);
  const removedHeaders = removeHeliconeHeaders(headers);

  let headersWithExtra = removedHeaders;
  if (props.extraHeaders) {
    headersWithExtra = joinHeaders(removedHeaders, props.extraHeaders);
  }

  const baseInit = { method, headers: headersWithExtra };
  const init = method === "GET" ? { ...baseInit } : { ...baseInit, body };

  let response;
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
