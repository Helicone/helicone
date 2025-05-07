import { HeliconeProxyRequest } from "../models/HeliconeProxyRequest";
import { ReadableInterceptor } from "../util/ReadableInterceptor";

function maybeForceFormat(
  proxyRequest: HeliconeProxyRequest,
  body: ReadableStream
): ReadableStream {
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
    return body.pipeThrough(transformer) ?? null;
  }
  return body;
}

function getBodiesMaybeTee(
  request: HeliconeProxyRequest,
  ogBody: ReadableStream
):
  | {
      wasTee: true;
      body1: ReadableStream;
      body2: ReadableStream;
    }
  | {
      wasTee: false;
    } {
  const body = maybeForceFormat(request, ogBody);

  /**
   * teeing the body is not well tested and is needed only to fix gemini for now.
   *
   * After some more testing we can slowly release this to other providers.
   * - Justin, 03/16/2025
   */
  if (
    request.requestWrapper.heliconeHeaders.targetBaseUrl?.endsWith(
      "aiplatform.googleapis.com/v1"
    )
  ) {
    const [body1, body2] = body!.tee();
    return { wasTee: true, body1, body2 };
  } else {
    return { wasTee: false };
  }
}

export function getBodyInterceptor(
  request: HeliconeProxyRequest,
  response: Response
): {
  body: ReadableStream | null;
  interceptor: ReadableInterceptor | null;
} {
  if (!response.body) {
    return { body: null, interceptor: null };
  }
  const maybeTee = getBodiesMaybeTee(request, response.body);
  if (maybeTee.wasTee) {
    const interceptor = new ReadableInterceptor(
      maybeTee.body2,
      request.isStream
    );
    return {
      body: maybeTee.body1,
      interceptor,
    };
  } else {
    return {
      body: response.body,
      interceptor: null,
    };
  }
}
