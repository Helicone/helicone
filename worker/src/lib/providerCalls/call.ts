import { HeliconeProxyRequest } from "../HeliconeProxyRequest/mapper";
export interface CallProps {
  headers: Headers;
  method: string;
  apiBase: string;
  body: string | null;
  increaseTimeout: boolean;
  originalUrl: URL;
  targetUrl: URL;
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
    targetUrl: proxyRequest.targetUrl,
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
  const { headers, method, body, increaseTimeout, targetUrl } = props;
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
