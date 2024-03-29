import {
  HeliconeProxyRequest,
  RetryOptions,
} from "../HeliconeProxyRequest/mapper";
import retry from "async-retry";

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
    if (!key.toLowerCase().startsWith("helicone-")) {
      newHeaders.set(key, value);
    }
  }
  return newHeaders;
}

export async function callProvider(props: CallProps): Promise<Response> {
  const { headers, method, apiBase, body, increaseTimeout, originalUrl } =
    props;

  const targetUrl = buildTargetUrl(originalUrl, apiBase);

  const baseInit = { method, headers: removeHeliconeHeaders(headers) };
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
    response = await fetch(targetUrl.href, init);
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
