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

export function isErr<T, K>(result: Result<T, K>) {
  return result.error !== null;
}
