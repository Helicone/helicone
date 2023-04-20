import { forwardRequestToOpenAi, RequestSettings } from ".";
import retry from "async-retry";

export interface RetryOptions {
  retries: number; // number of times to retry the request
  factor: number; // exponential backoff factor
  minTimeout: number; // minimum amount of time to wait before retrying (in milliseconds)
  maxTimeout: number; // maximum amount of time to wait before retrying (in milliseconds)
}

export function getRetryOptions(request: Request): RetryOptions | undefined {
  const headers = request.headers;

  const enabled = headers.get("helicone-retry-enabled") !== null ? true : false;

  if (!enabled) {
    return undefined;
  }

  const retries =
    headers.get("helicone-retry-num") !== null
      ? parseInt(headers.get("helicone-retry-num")!, 10)
      : 5;

  const factor =
    headers.get("helicone-retry-factor") !== null
      ? parseFloat(headers.get("helicone-retry-factor")!)
      : 2;

  const minTimeout =
    headers.get("helicone-retry-min-timeout") !== null
      ? parseInt(headers.get("helicone-retry-min-timeout")!, 10)
      : 1000;

  const maxTimeout =
    headers.get("helicone-retry-max-timeout") !== null
      ? parseInt(headers.get("helicone-retry-max-timeout")!, 10)
      : 10000;

  const retryOptions: RetryOptions = {
    retries,
    factor,
    minTimeout,
    maxTimeout,
  };

  return retryOptions;
}

export async function forwardRequestToOpenAiWithRetry(
  request: Request,
  requestSettings: RequestSettings,
  retryOptions: RetryOptions,
  body?: string
): Promise<Response> {
  let lastError;
  let lastResponse;

  try {
    // Use async-retry to call the forwardRequestToOpenAi function with exponential backoff
    await retry(
      async (bail, attempt) => {
        try {
          const res = await forwardRequestToOpenAi(
            request,
            requestSettings,
            body
          );

          lastResponse = res;
          // Throw an error if the status code is 429
          if (res.status === 429 || res.status === 500) {
            throw new Error(`Status code ${res.status}`);
          }
          return res;
        } catch (e) {
          lastError = e;
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
