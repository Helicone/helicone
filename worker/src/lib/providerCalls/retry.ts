import retry from "async-retry";
import { RetryOptions } from "../HeliconeProxyRequest/mapper";
import { CallProps, callProvider } from "./call";

export async function callProviderWithRetry(
  callProps: CallProps,
  retryOptions: RetryOptions
): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let lastError;
  let lastResponse;

  try {
    // Use async-retry to call the forwardRequestToOpenAi function with exponential backoff
    await retry(
      async (bail, attempt) => {
        try {
          const res = await callProvider(callProps);

          lastResponse = res;
          // Throw an error if the status code is 429
          if (res.status === 429 || res.status === 500 || res.status === 522) {
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
