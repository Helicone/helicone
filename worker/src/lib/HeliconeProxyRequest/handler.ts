import { Result } from "../../results";
import { callProviderWithRetry } from "../providerCalls/retry";
import { ReadableInterceptor } from "../ReadableInterceptor";
import { DBLoggable } from "../dbLogger/DBLoggable";
import { callPropsFromProxyRequest, callProvider } from "../providerCalls/call";
import { HeliconeProxyRequest } from "./mapper";
import { dbLoggableRequestFromProxyRequest } from "../dbLogger/DBLoggable";

export type ProxyResult = {
  loggable: DBLoggable;
  response: Response;
};

export async function handleProxyRequest(
  proxyRequest: HeliconeProxyRequest
): Promise<Result<ProxyResult, string>> {
  const { providerAuthHash, retryOptions } = proxyRequest;
  if (!providerAuthHash) {
    return {
      data: null,
      error: "No provider auth hash",
    };
  }
  const callProps = callPropsFromProxyRequest(proxyRequest);
  const response = await (retryOptions
    ? callProviderWithRetry(callProps, retryOptions)
    : callProvider(callProps));

  const interceptor = response.body
    ? new ReadableInterceptor(response.body)
    : null;
  let body = interceptor ? interceptor.stream : null;

  if (
    proxyRequest.requestWrapper.heliconeHeaders.featureFlags.streamForceFormat
  ) {
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

  return {
    data: {
      loggable: new DBLoggable({
        request: dbLoggableRequestFromProxyRequest(proxyRequest),
        response: {
          getResponseBody: async () => interceptor?.waitForChunk() ?? "",
          responseHeaders: new Headers(response.headers),
          status: response.status,
        },
      }),
      response: new Response(body, {
        ...response,
        headers: responseHeaders,
      }),
    },
    error: null,
  };
}
