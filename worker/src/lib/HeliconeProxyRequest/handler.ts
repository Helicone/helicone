import { Result } from "../../results";
import { CompletedChunk, ReadableInterceptor } from "../ReadableInterceptor";
import {
  DBLoggable,
  dbLoggableRequestFromProxyRequest,
} from "../dbLogger/DBLoggable";
import { callPropsFromProxyRequest, callProvider } from "../providerCalls/call";
import { callProviderWithRetry } from "../providerCalls/retry";
import { HeliconeProxyRequest } from "./mapper";

export type ProxyResult = {
  loggable: DBLoggable;
  response: Response;
};

function getStatus(
  responseStatus: number,
  endReason?: CompletedChunk["reason"]
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

export async function handleProxyRequest(
  proxyRequest: HeliconeProxyRequest
): Promise<Result<ProxyResult, string>> {
  const { retryOptions } = proxyRequest;

  const callProps = callPropsFromProxyRequest(proxyRequest);
  const response = await (retryOptions
    ? callProviderWithRetry(callProps, retryOptions)
    : callProvider(callProps));

  const interceptor = response.body
    ? new ReadableInterceptor(response.body, proxyRequest.isStream)
    : null;
  let body = interceptor ? interceptor.stream : null;
  const model = await proxyRequest.requestWrapper.getJson<{ model?: string }>();
  if (
    model.model &&
    model.model.includes("claude-3") &&
    proxyRequest.isStream
  ) {
    let buffer: Uint8Array | null = null;
    const transformer = new TransformStream({
      transform(chunk, controller) {
        if (chunk.toString().includes("data")) {
          controller.enqueue(chunk);
        } else if (buffer && buffer.toString().includes("data")) {
          controller.enqueue(buffer);
          buffer = null;
        } else if (buffer) {
          const mergedArray = new Uint8Array(buffer.length + chunk.length);
          mergedArray.set(buffer);
          mergedArray.set(chunk, buffer.length);
          buffer = mergedArray;
        } else {
          buffer = chunk;
        }
      },
    });
    body = body?.pipeThrough(transformer) ?? null;
  }

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

  return {
    data: {
      loggable: new DBLoggable({
        request: dbLoggableRequestFromProxyRequest(proxyRequest),
        response: {
          responseId: crypto.randomUUID(),
          getResponseBody: async () => ({
            body: (await interceptor?.waitForChunk())?.body ?? "",
            endTime: new Date(
              (await interceptor?.waitForChunk())?.endTimeUnix ??
                new Date().getTime()
            ),
          }),
          responseHeaders: new Headers(response.headers),
          status: async () => {
            return getStatus(
              response.status,
              (await interceptor?.waitForChunk())?.reason
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
              const chunk = await interceptor?.waitForChunk();
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
}

export async function handleThreatProxyRequest(
  proxyRequest: HeliconeProxyRequest
): Promise<Result<ProxyResult, string>> {
  const responseHeaders = new Headers();
  responseHeaders.set("Helicone-Status", "failed");
  responseHeaders.set("Helicone-Id", proxyRequest.requestId);
  const threatProxyResponse = {
    data: {
      loggable: new DBLoggable({
        request: dbLoggableRequestFromProxyRequest(proxyRequest),
        response: {
          responseId: crypto.randomUUID(),
          getResponseBody: async () => ({
            body: "{}",
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
