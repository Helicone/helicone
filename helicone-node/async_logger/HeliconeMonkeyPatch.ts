import { APIPromise } from "openai/core";
import { Stream } from "openai/streaming";

export function wrapAPIPromise<T>(
  apiPromise: APIPromise<T>,
  onLoggingStreamAvailable?: (loggingStream: Stream<T>) => void
): APIPromise<T> {
  const originalThen = apiPromise.then.bind(apiPromise);
  apiPromise.then = async function <TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2> {
    return originalThen(onfulfilled, onrejected).then((value: T) => {
      if (value instanceof Stream) {
        const [consumerStream, loggingStream] = value.tee();

        if (onLoggingStreamAvailable) {
          onLoggingStreamAvailable(loggingStream);
        }
        return consumerStream;
      } else {
        return value;
      }
    });
  };

  const originalWithResponse = apiPromise.withResponse.bind(apiPromise);
  apiPromise.withResponse = async function (): Promise<{
    data: T;
    response: Response;
  }> {
    const { data, response } = await originalWithResponse();

    if (data instanceof Stream) {
      const [consumerStream, loggingStream] = data.tee();

      if (onLoggingStreamAvailable) {
        onLoggingStreamAvailable(loggingStream);
      }

      return { data: consumerStream as T, response };
    } else {
      return { data, response };
    }
  };

  return apiPromise;
}
