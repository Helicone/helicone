import { Result, ok, err } from "../util/results";
import { 
  CompletedStream,
  ReadableInterceptor 
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
  try {
    if (responseOverride) {
      return responseOverride;
    } else if (retryOptions) {
      return await callProviderWithRetry(callProps, retryOptions);
    } else {
      return await callProvider(callProps);
    }
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes("Network connection lost")) {
        return new Response(
          JSON.stringify({
            error: "Network connection lost",
            message: "Unable to connect to the provider",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      return new Response(
        JSON.stringify({
          error: e.message,
          message: "Error calling provider",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    return new Response(
      JSON.stringify({
        error: "Unknown error",
        message: "Error calling provider",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function handleProxyRequest(
  proxyRequest: HeliconeProxyRequest,
  responseOverride?: Response
): Promise<Result<ProxyResult, string>> {
  const { retryOptions } = proxyRequest;

  const requestStartTime = new Date();
  const callProps = callPropsFromProxyRequest(proxyRequest);

  // Convert old retry options format to new format if needed
  let updatedRetryOptions: RetryOptions | null = null;
  if (retryOptions && 'enabled' in retryOptions && retryOptions.enabled) {
    updatedRetryOptions = {
      attempts: retryOptions.retries,
      backoff: retryOptions.factor,
      maxTimeout: retryOptions.maxTimeout
    };
  } else {
    updatedRetryOptions = retryOptions as RetryOptions | null;
  }

  const response = await getProviderResponse(
    callProps,
    updatedRetryOptions,
    responseOverride
  );

  const interceptor = response.body
    ? new ReadableInterceptor(response.body, proxyRequest.isStream)
    : null;
  let body = interceptor ? interceptor.stream : null;

  const responseBuilder = new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  const loggable = dbLoggableRequestFromProxyRequest(
    proxyRequest,
    responseBuilder,
    requestStartTime
  );

  if (interceptor) {
    interceptor.onComplete = (completedStream: CompletedStream) => {
      loggable.status = getStatus(response.status, completedStream.reason);
      loggable.responseBody = completedStream.body;
      loggable.responseHeaders = Object.fromEntries(response.headers.entries());
      loggable.responseTimeAt = new Date();
    };
  } else {
    loggable.status = response.status;
    loggable.responseBody = null;
    loggable.responseHeaders = Object.fromEntries(response.headers.entries());
    loggable.responseTimeAt = new Date();
  }

  return ok({
    loggable,
    response: responseBuilder,
  });
}

