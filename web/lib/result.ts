export interface ResultError<K> {
  data: null;
  error: K;
}

export interface ResultSuccess<T> {
  data: T;
  error: null;
}

export type Result<T, K> = ResultSuccess<T> | ResultError<K>;

export function isError<T, K>(result: Result<T, K>): result is ResultError<K> {
  return result.error !== null;
}

export function isSuccess<T, K>(
  result: Result<T, K>
): result is ResultSuccess<T> {
  return result.error === null;
}

export function unwrap<T, K>(result: Result<T, K>): T {
  console.log("UNWRAP")
  if (isError(result)) {
    throw new Error(JSON.stringify(result.error));
  }
  return result.data;
}

export async function unwrapAsync<T, K>(
  result: Promise<Result<T, K>>
): Promise<T> {
  return unwrap(await result);
}

export function unwrapList<T extends unknown, K>(results: Result<T, K>[]): T[] {
  return results.map((result) => unwrap(result));
}
