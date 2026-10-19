import {
  HeliconeProxyRequest,
  RetryOptions,
} from "../models/HeliconeProxyRequest";
import retry from "async-retry";
import { llmmapper } from "./llmmapper/llmmapper";
import { ValidRequestBody } from "../../RequestBodyBuffer/IRequestBodyBuffer";
import { buildProviderRequestHeaders } from "../security/outboundHeaders";
import {
  CredentialPin,
  isTargetAllowedForPin,
  pinnedTargetRejection,
} from "../security/credentialPin";

export interface CallProps {
  headers: Headers;
  method: string;
  apiBase: string;
  body: ValidRequestBody;
  increaseTimeout: boolean;
  originalUrl: URL;
  extraHeaders: Headers | null;
  env: Env;
  /**
   * Set when the request carries a provider key Helicone injected (vault or
   * AI Gateway BYOK). The target must then be that provider's first-party
   * origin.
   */
  credentialPin?: CredentialPin | null;
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
    credentialPin: proxyRequest.requestWrapper.getCredentialPin(),
  };
}

// Provider credentials are never forwarded across a redirect: a 3xx from the
// target is returned to the caller as-is instead of being followed.
const PROVIDER_FETCH_REDIRECT = "manual" as const;

async function callWithMapper(
  targetUrl: URL,
  init:
    | {
      method: string;
      headers: Headers;
      redirect?: RequestInit["redirect"];
    }
    | {
      body: string;
      method: string;
      headers: Headers;
      redirect?: RequestInit["redirect"];
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

  // Mock responses short-circuit the provider call. Only honoured in local
  // development; elsewhere the header is ignored (and never forwarded).
  const mockResponseHeader =
    env.ENVIRONMENT === "development"
      ? headers.get("__helicone-mock-response")
      : null;
  if (mockResponseHeader) {
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

  // Last line of defence for injected credentials: whatever routed us here,
  // a vault / BYOK key only goes to its provider's first-party origin.
  if (
    props.credentialPin &&
    !isTargetAllowedForPin(props.credentialPin, targetUrl)
  ) {
    console.warn(
      `[credential-pin] refusing ${props.credentialPin.source} key for provider "${props.credentialPin.providerName ?? "unknown"}" to ${targetUrl.origin}`
    );
    return pinnedTargetRejection(props.credentialPin, targetUrl);
  }

  // Outbound headers come from an allowlist; Helicone headers and any header
  // carrying a Helicone key are never sent to the provider.
  const headersWithExtra = buildProviderRequestHeaders(
    headers,
    props.extraHeaders
  );

  if (
    originalUrl.host.includes("localhost") ||
    originalUrl.host.includes("127.0.0.1")
  ) {
    headersWithExtra.set("Accept-Encoding", "Identity");
  }

  const baseInit = {
    method,
    headers: headersWithExtra,
    redirect: PROVIDER_FETCH_REDIRECT,
  };
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
