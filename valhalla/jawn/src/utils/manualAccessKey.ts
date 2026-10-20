import crypto from "crypto";

/**
 * Constant-time comparison of a provided secret against an expected one.
 * Fails closed when either value is missing or empty.
 */
export function secretsMatch(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (typeof provided !== "string" || typeof expected !== "string") {
    return false;
  }
  if (provided.length === 0 || expected.length === 0) {
    return false;
  }
  // Hash both sides so timingSafeEqual always sees equal-length inputs and the
  // comparison does not leak the expected length.
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * True only when HELICONE_MANUAL_ACCESS_KEY is configured and `provided`
 * matches it. Unset or empty configuration denies every caller.
 */
export function matchesManualAccessKey(
  provided: string | null | undefined
): boolean {
  return secretsMatch(provided, process.env.HELICONE_MANUAL_ACCESS_KEY);
}
