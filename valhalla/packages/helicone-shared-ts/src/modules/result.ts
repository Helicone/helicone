export type Result<T, K> = SuccessResult<T> | ErrorResult<K>;

interface SuccessResult<T> {
  data: T;
  error: null;
}
interface ErrorResult<T> {
  data: null;
  error: T;
}

export type GenericResult<T> = Result<T, string>;
export type PromiseGenericResult<T> = Promise<GenericResult<T>>;

export function isErr<T, K>(result: Result<T, K>) {
  return result.error !== null;
}

export function isOk<T, K>(result: Result<T, K>) {
  return result.error === null;
}

export function ok<T, K>(data: T): Result<T, K> {
  return { data: data, error: null };
}

export function err<T, K>(error: K): Result<T, K> {
  return { data: null, error: error };
}
