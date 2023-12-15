import { HeliconeProxyRequest } from "../HeliconeProxyRequest/mapper";
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
  const apiBaseUrl = new URL(apiBase.replace(/\/$/, "")); // remove trailing slash if any

  const new_url = new URL(
    `${apiBaseUrl.origin}${originalUrl.pathname}${originalUrl.search}`
  );

  const baseInit = { method, headers: removeHeliconeHeaders(headers) };
  const init = method === "GET" ? { ...baseInit } : { ...baseInit, body };

  let response;
  if (increaseTimeout) {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => controller.abort(), 1000 * 60 * 30);
    response = await fetch(new_url.href, {
      ...init,
      signal,
    });
  } else {
    response = await fetch(new_url.href, init);
  }
  return response;
}
