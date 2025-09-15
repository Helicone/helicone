/**
 * Common Result type for safe operations across the codebase
 * Copied from @helicone/common to avoid cross-package import issues
 */

export interface ResultError<K> {
  data: null;
  error: K;
}

export interface ResultSuccess<T> {
  data: T;
  error: null;
}

export type Result<T, K = string> = ResultSuccess<T> | ResultError<K>;

export function isError<T, K>(result: Result<T, K>): result is ResultError<K> {
  return result.error !== null;
}

export function isSuccess<T, K>(
  result: Result<T, K>
): result is ResultSuccess<T> {
  return result.error === null;
}

export function unwrap<T, K>(result: Result<T, K>): T {
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

export function ok<T, K = string>(data: T): Result<T, K> {
  return { data, error: null };
}

export function err<T, K = string>(error: K): Result<T, K> {
  return { data: null, error };
}

export function resultMap<T, K, Z>(
  result: Result<T, K>,
  f: (data: T) => Z
): Result<Z, K> {
  if (isError(result)) {
    return result;
  }
  return { data: f(result.data), error: null };
}

export function map<T, K, L>(
  result: Result<T, K>,
  mapFn: (data: T) => L
): Result<L, K> {
  if (result.error === null) {
    return ok(mapFn(result.data as T));
  }
  return err(result.error);
}

export function promiseResultMap<T, K, Z>(
  result: Result<T, K>,
  f: (data: T) => Promise<Z>
): Promise<Result<Z, K>> {
  if (isError(result)) {
    return Promise.resolve(result);
  }
  return f(result.data).then((data) => ok(data));
}

type NonNull<T> = T extends null ? never : T;
type Unwrap<T> = T extends Result<infer U, infer K> ? NonNull<U> : never;
type UnwrapError<T> = T extends Result<infer U, infer K> ? NonNull<K> : never;
type AllSuccessTuple<T extends Result<any, any>[]> = {
  [I in keyof T]: Unwrap<T[I]>;
};

export function resultsAll<T extends Result<any, any>[]>(
  results: [...T]
): Result<AllSuccessTuple<T>, UnwrapError<T[number]>> {
  const data: any[] = [];

  for (const r of results) {
    if (r.error !== null) {
      return err(r.error);
    }
    data.push(r.data);
  }

  return ok(data as AllSuccessTuple<T>);
}