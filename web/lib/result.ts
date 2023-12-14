export interface ResultError<K> {
  data: null;
  error: K;
}

export interface ResultSuccess<T> {
  data: T;
  error: null;
}

/**
 * Represents a result that can either be a success or an error.
 * @template T The type of the success result.
 * @template K The type of the error result.
 */
export type Result<T, K> = ResultSuccess<T> | ResultError<K>;

/**
 * Checks if the given result is an error.
 * @param result The result to check.
 * @returns True if the result is an error, false otherwise.
 */
export function isError<T, K>(result: Result<T, K>): result is ResultError<K> {
  return result.error !== null;
}

/**
 * Checks if the given result is a success.
 * @param result The result to check.
 * @returns True if the result is a success, false otherwise.
 */
export function isSuccess<T, K>(
  result: Result<T, K>
): result is ResultSuccess<T> {
  return result.error === null;
}

/**
 * Unwraps the data from a Result object.
 * If the Result object is an error, it throws an Error with the error message.
 * Otherwise, it returns the data.
 *
 * @param result - The Result object to unwrap.
 * @returns The unwrapped data.
 * @throws Error if the Result object is an error.
 * @typeparam T - The type of the data in the Result object.
 * @typeparam K - The type of the error in the Result object.
 */
export function unwrap<T, K>(result: Result<T, K>): T {
  if (isError(result)) {
    throw new Error(JSON.stringify(result.error));
  }
  return result.data;
}

/**
 * Unwraps the value of a promise that resolves to a Result object.
 *
 * @param result - The promise that resolves to a Result object.
 * @returns A promise that resolves to the unwrapped value.
 */
export async function unwrapAsync<T, K>(
  result: Promise<Result<T, K>>
): Promise<T> {
  return unwrap(await result);
}

/**
 * Unwraps a list of results and returns an array of the unwrapped values.
 *
 * @param results - An array of Result objects.
 * @returns An array of the unwrapped values.
 */
export function unwrapList<T extends unknown, K>(results: Result<T, K>[]): T[] {
  return results.map((result) => unwrap(result));
}

/**
 * Maps the data of a Result object using a provided function.
 * If the input Result object is an error, it is returned as is.
 * @param result - The Result object to map.
 * @param f - The function to apply to the data of the Result object.
 * @returns A new Result object with the mapped data or the original error.
 */
export function resultMap<T, K, Z>(
  result: Result<T, K>,
  f: (data: T) => Z
): Result<Z, K> {
  if (isError(result)) {
    return result;
  }
  return { data: f(result.data), error: null };
}

/**
 * Creates a Result object with a successful outcome.
 * @param data - The data to be wrapped in the Result object.
 * @returns A Result object with the provided data and no error.
 */
export function ok<T, K>(data: T): Result<T, K> {
  return { data: data, error: null };
}

/**
 * Creates a Result object representing an error.
 * @template T - The type of the data.
 * @template K - The type of the error.
 * @param {K} error - The error value.
 * @returns {Result<T, K>} - The Result object representing the error.
 */
export function err<T, K>(error: K): Result<T, K> {
  return { data: null, error: error };
}

type NonNull<T> = T extends null ? never : T;
type Unwrap<T> = T extends Result<infer U, infer K> ? NonNull<U> : never;
type UnwrapError<T> = T extends Result<infer U, infer K> ? NonNull<K> : never;
type AllSuccessTuple<T extends Result<any, any>[]> = {
  [I in keyof T]: Unwrap<T[I]>;
};

/**
 * Combines an array of results into a single result that represents the success or failure of all the individual results.
 * @param results An array of results to combine.
 * @returns A result that contains either an array of all the success values or the first error encountered.
 */
export function resultsAll<T extends Result<any, any>[]>(
  results: [...T]
): Result<AllSuccessTuple<T>, UnwrapError<T[number]>> {
  const data: any[] = [];

  for (let i = 0; i < results.length; i++) {
    if (isError(results[i])) {
      return err(results[i].error);
    } else {
      data.push(results[i].data);
    }
  }

  return ok(data as AllSuccessTuple<T>);
}
