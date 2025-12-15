import { Result } from "../util/results";
import {
  CompletedStream,
  ReadableInterceptor,
} from "../util/ReadableInterceptor";
import {
  DBLoggable,
  dbLoggableRequestFromProxyRequest,
} from "../dbLogger/DBLoggable";
import {
  CallProps,
  callPropsFromProxyRequest,
  callProvider,
  callProviderWithRetry,
} from "../clients/ProviderClient";
import {
  HeliconeProxyRequest,
  RetryOptions,
} from "../models/HeliconeProxyRequest";

export type ProxyResult = {
  loggable: DBLoggable;
  response: Response;
};

function getStatus(
  responseStatus: number,
  endReason?: CompletedStream["reason"]
) {
  if (!endReason) {
    return responseStatus;
  } else if (endReason === "done") {
    return responseStatus;
  } else if (endReason === "cancel") {
    return -3;
  } else if (endReason === "timeout") {
    return -2;
  } else {
    return -100;
  }
}
/**
 * Error classification for better diagnostics
 */
type ErrorClassification = {
  type:
    | "network_error"
    | "timeout"
    | "dns_error"
    | "connection_refused"
    | "ssl_error"
    | "provider_error"
    | "internal_error";
  statusCode: number;
  userMessage: string;
  internalMessage: string;
};

/**
 * Classifies an error to determine its type and appropriate response
 */
function classifyError(e: unknown): ErrorClassification {
  if (!(e instanceof Error)) {
    return {
      type: "internal_error",
      statusCode: 500,
      userMessage: "An unexpected error occurred while processing your request",
      internalMessage: `Non-Error exception: ${safeStringify(e)}`,
    };
  }

  const message = e.message.toLowerCase();
  const name = e.name;

  // Network connection lost (Cloudflare Workers specific)
  if (
    message.includes("network connection lost") ||
    message.includes("failed to fetch") ||
    message.includes("fetch failed")
  ) {
    return {
      type: "network_error",
      statusCode: 502,
      userMessage: "Unable to connect to the provider. Please retry your request.",
      internalMessage: `Network error: ${e.message}`,
    };
  }

  // Timeout errors
  if (
    message.includes("timeout") ||
    name === "AbortError" ||
    message.includes("aborted") ||
    message.includes("deadline exceeded")
  ) {
    return {
      type: "timeout",
      statusCode: 504,
      userMessage: "The request to the provider timed out. Please retry your request.",
      internalMessage: `Timeout: ${e.message}`,
    };
  }

  // DNS resolution errors
  if (
    message.includes("getaddrinfo") ||
    message.includes("dns") ||
    message.includes("enotfound") ||
    message.includes("name resolution")
  ) {
    return {
      type: "dns_error",
      statusCode: 502,
      userMessage: "Unable to resolve provider address. Please check the provider URL.",
      internalMessage: `DNS error: ${e.message}`,
    };
  }

  // Connection refused
  if (
    message.includes("econnrefused") ||
    message.includes("connection refused") ||
    message.includes("econnreset") ||
    message.includes("connection reset")
  ) {
    return {
      type: "connection_refused",
      statusCode: 502,
      userMessage:
        "Connection to the provider was refused or reset. The provider may be temporarily unavailable.",
      internalMessage: `Connection error: ${e.message}`,
    };
  }

  // SSL/TLS errors
  if (
    message.includes("ssl") ||
    message.includes("tls") ||
    message.includes("certificate") ||
    message.includes("handshake")
  ) {
    return {
      type: "ssl_error",
      statusCode: 502,
      userMessage: "SSL/TLS connection error with the provider.",
      internalMessage: `SSL error: ${e.message}`,
    };
  }

  // Retry exhaustion (from callProviderWithRetry)
  if (message.includes("error occurred while retrying")) {
    return {
      type: "provider_error",
      statusCode: 502,
      userMessage:
        "The provider returned errors after multiple retry attempts. Please try again later.",
      internalMessage: `Retry exhausted: ${e.message}`,
    };
  }

  // Default: internal error
  return {
    type: "internal_error",
    statusCode: 500,
    userMessage: "An unexpected error occurred while processing your request",
    internalMessage: `Unclassified error: ${e.name}: ${e.message}`,
  };
}

/**
 * Safely stringifies an object, handling circular references
 */
function safeStringify(obj: unknown): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    });
  } catch {
    return String(obj);
  }
}

/**
 * Builds an error trace string from an error
 */
function buildErrorTrace(e: unknown): string {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}\n${e.stack || "No stack trace"}`;
  }
  return safeStringify(e);
}

async function getProviderResponse(
  callProps: CallProps,
  retryOptions: RetryOptions | null,
  responseOverride?: Response
): Promise<Response> {
  try {
    if (responseOverride) {
      return responseOverride;
    } else if (retryOptions) {
      return await callProviderWithRetry(callProps, retryOptions);
    } else {
      return await callProvider(callProps);
    }
  } catch (e) {
    const classification = classifyError(e);

    // Log error for debugging and monitoring
    console.error(
      `[ProxyRequestHandler] ${classification.type} error:`,
      classification.internalMessage,
      {
        targetUrl: callProps.apiBase,
        errorType: classification.type,
        statusCode: classification.statusCode,
      }
    );

    const errorResponse = {
      error: classification.type,
      code: classification.type,
      message: classification.userMessage,
      "helicone-message": classification.userMessage,
      "helicone-error-type": classification.type,
      support:
        "Please reach out on our discord or email us at help@helicone.ai, we'd love to help!",
      "provider-url": callProps.apiBase,
      "error-trace": buildErrorTrace(e),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: classification.statusCode,
      headers: {
        "content-type": "application/json",
        "x-helicone-error-type": classification.type,
      },
    });
  }
}

export async function handleProxyRequest(
  proxyRequest: HeliconeProxyRequest,
  responseOverride?: Response
): Promise<Result<ProxyResult, string>> {
  const { retryOptions } = proxyRequest;

  const requestStartTime = new Date();
  const callProps = callPropsFromProxyRequest(proxyRequest);

  const response = await getProviderResponse(
    callProps,
    retryOptions,
    responseOverride
  );

  const interceptor = response.body
    ? new ReadableInterceptor(
        response.body,
        proxyRequest.isStream,
        proxyRequest.requestWrapper.getDataDogClient()
      )
    : null;
  let body = interceptor ? interceptor.stream : null;

  if (
    proxyRequest.requestWrapper.heliconeHeaders.featureFlags.streamForceFormat
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let buffer: any = null;
    const transformer = new TransformStream({
      transform(chunk, controller) {
        if (chunk.length < 50) {
          buffer = chunk;
        } else {
          if (buffer) {
            const mergedArray = new Uint8Array(buffer.length + chunk.length);
            mergedArray.set(buffer);
            mergedArray.set(chunk, buffer.length);
            controller.enqueue(mergedArray);
          } else {
            controller.enqueue(chunk);
          }
          buffer = null;
        }
      },
    });
    body = body?.pipeThrough(transformer) ?? null;
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("Helicone-Status", "success");
  responseHeaders.set("Helicone-Id", proxyRequest.requestId);

  // Add AI Gateway specific headers if this is a gateway request
  const gatewayAttempt = proxyRequest.requestWrapper.getGatewayAttempt();
  if (gatewayAttempt) {
    responseHeaders.set(
      "Helicone-Gateway-Mode",
      gatewayAttempt.authType.toUpperCase()
    );
    responseHeaders.set("Helicone-Provider", gatewayAttempt.endpoint.provider);
    responseHeaders.set(
      "Helicone-Model",
      gatewayAttempt.endpoint.providerModelId
    );
  }

  let status = response.status;
  if (status < 200 || status >= 600) {
    console.error("Invalid status code: ", status);
    status = 500;
    if (status === 100) {
      status = 200;
    }
  }

  const result = {
    data: {
      loggable: new DBLoggable({
        request: dbLoggableRequestFromProxyRequest(
          proxyRequest,
          requestStartTime
        ),
        response: {
          responseId: crypto.randomUUID(),
          getResponseBody: async () => ({
            body: (await interceptor?.waitForStream())?.body ?? [],
            endTime: new Date(
              (await interceptor?.waitForStream())?.endTimeUnix ??
                new Date().getTime()
            ),
          }),
          responseHeaders: new Headers(response.headers),
          status: async () => {
            return getStatus(
              response.status,
              (await interceptor?.waitForStream())?.reason
            );
          },
          omitLog:
            proxyRequest.requestWrapper.heliconeHeaders.omitHeaders
              .omitResponse,
        },
        timing: {
          startTime: proxyRequest.startTime,
          timeToFirstToken: async () => {
            if (proxyRequest.isStream) {
              const chunk = await interceptor?.waitForStream();
              const startTimeUnix = proxyRequest.startTime.getTime();
              if (chunk?.firstChunkTimeUnix && startTimeUnix) {
                return chunk.firstChunkTimeUnix - startTimeUnix;
              }
            }

            return null;
          },
        },
        tokenCalcUrl: proxyRequest.tokenCalcUrl,
      }),
      response: new Response(body, {
        ...response,
        headers: responseHeaders,
        status: status,
      }),
    },
    error: null,
  };
  return result;
}

export async function handleThreatProxyRequest(
  proxyRequest: HeliconeProxyRequest,
  requestStartTime: Date
): Promise<Result<ProxyResult, string>> {
  const responseHeaders = new Headers();
  responseHeaders.set("Helicone-Status", "failed");
  responseHeaders.set("Helicone-Id", proxyRequest.requestId);
  const threatProxyResponse = {
    data: {
      loggable: new DBLoggable({
        request: dbLoggableRequestFromProxyRequest(
          proxyRequest,
          requestStartTime
        ),
        response: {
          responseId: crypto.randomUUID(),
          getResponseBody: async () => ({
            body: ["{}"],
            endTime: new Date(new Date().getTime()),
          }),
          responseHeaders: responseHeaders,
          status: async () => -4,
          omitLog:
            proxyRequest.requestWrapper.heliconeHeaders.omitHeaders
              .omitResponse,
        },
        timing: {
          startTime: proxyRequest.startTime,
          timeToFirstToken: async () => null,
        },
        tokenCalcUrl: proxyRequest.tokenCalcUrl,
      }),
      response: new Response("{}", {
        status: 500,
        headers: responseHeaders,
      }),
    },
    error: null,
  };

  return threatProxyResponse;
}
