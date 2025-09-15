/**
 * Supabase-specific utilities for the gateway package
 * These utilities require @supabase/supabase-js to be installed
 */

import { Result, ok, err } from "./results";

// Type-only import to avoid runtime dependency
type PostgrestSingleResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

/**
 * Maps a Postgrest response to a Result type
 * @param result Postgrest response
 * @returns Result with data or error message
 */
export function mapPostgrestErr<T>(
  result: PostgrestSingleResponse<T>
): Result<T, string> {
  if (result.error === null && result.data !== null) {
    return ok(result.data);
  }
  return err(result.error?.message || "Unknown error");
}