/**
 * Core utilities for the gateway package
 */

// Export Result type and utilities
export * from "./results";

// Export constants
export * from "./constants";

// Export helper functions
export * from "./helpers";

// Export supabase utilities
export * from "./supabase-utils";

// Additional Result utilities specific to gateway
import { Result, ok, err } from "./results";

/**
 * Maps the error of a Result to a new type
 * @param result Original result
 * @param mapFn Function to map the error
 * @returns Result with mapped error type
 */
export function errMap<T, K, L>(
  result: Result<T, K>,
  mapFn: (error: K) => L
): Result<T, L> {
  if (result.error === null) {
    return ok(result.data as T);
  }
  return err(mapFn(result.error));
}