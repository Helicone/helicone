import { Result } from "../shared/result";
import { DBLoggable, dbLoggableRequestFromProxyRequest } from "./DBLoggable";
import { HeliconeProxyRequest } from "./HeliconeProxyRequest";
import {
  callPropsFromProxyRequest,
  callProvider,
  callProviderWithRetry,
} from "./ProviderClient";
import { CompletedChunk, ReadableInterceptor } from "./ReadableInterceptor";
import crypto from "crypto";
import { Headers, Response } from "node-fetch";

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

  const requestStartTime = new Date();
  const callProps = callPropsFromProxyRequest(proxyRequest);
  console.log("callProps", callProps);
  const response = await (retryOptions
    ? callProviderWithRetry(callProps, retryOptions)
    : callProvider(callProps));

  const interceptor = response.body
    ? new ReadableInterceptor(response.body as any, proxyRequest.isStream)
    : null;
  let body = interceptor ? interceptor.stream : null;

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

  if (interceptor) {
    console.log("Interceptor created, starting stream");
  } else {
    console.log("No interceptor created, ending response");
  }

  return {
    data: {
      loggable: new DBLoggable({
        request: dbLoggableRequestFromProxyRequest(
          proxyRequest,
          requestStartTime
        ),
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
      response: new Response(body ?? "", {
        ...response,
        headers: responseHeaders,
        status: status,
      }),
    },
    error: null,
  };
}
