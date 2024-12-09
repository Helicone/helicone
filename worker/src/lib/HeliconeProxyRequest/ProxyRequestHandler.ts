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
async function getProviderResponse(
  callProps: CallProps,
  retryOptions: RetryOptions | null,
  responseOverride?: Response
): Promise<Response> {
  if (responseOverride) {
    return responseOverride;
  } else if (retryOptions) {
    return callProviderWithRetry(callProps, retryOptions);
  } else {
    return callProvider(callProps);
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
    ? new ReadableInterceptor(response.body, proxyRequest.isStream)
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
