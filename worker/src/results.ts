import { PostgrestSingleResponse } from "@supabase/supabase-js";

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

export function mapPostgrestErr<T>(
  result: PostgrestSingleResponse<T>
): Result<T, string> {
  if (result.error === null) {
    return { data: result.data, error: null };
  }
  return { data: null, error: result.error.message };
}

export function errMap<T, K, L>(
  result: Result<T, K>,
  map: (error: K) => L
): Result<T, L> {
  if (result.error === null) {
    return ok(result.data as T);
  }
  return err(map(result.error));
}

export function map<T, K, L>(
  result: Result<T, K>,
  map: (data: T) => L
): Result<L, K> {
  if (result.error === null) {
    return ok(map(result.data as T));
  }
  return err(result.error);
}

export function isErr<T, K>(result: Result<T, K>) {
  return result.error !== null;
}

export function ok<T, K>(data: T): Result<T, K> {
  return { data: data, error: null };
}

export function err<T, K>(error: K): Result<T, K> {
  return { data: null, error: error };
}
