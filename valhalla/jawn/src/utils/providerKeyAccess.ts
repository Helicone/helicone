import { AuthParams } from "../packages/common/auth/types";

/**
 * Provider keys (OpenAI, Anthropic, AWS, ...) are customer secrets. Reading
 * them, or creating/changing/deleting them, is restricted to a real user
 * session (JWT) whose org role is owner or admin.
 *
 * Helicone API keys are never accepted: they authenticate as "bearer", carry
 * no org role, and are frequently distributed widely inside customer
 * infrastructure (including read-only keys). Org members are not accepted
 * either.
 */
export function isJwtOrgAdmin(authParams: AuthParams | undefined): boolean {
  if (!authParams || authParams.authType !== "jwt") {
    return false;
  }
  return authParams.role === "owner" || authParams.role === "admin";
}

const MASK = "••••••••";

/**
 * Mask a provider secret for display. Never returns enough of the value to be
 * usable: long values keep a short prefix (usually just the vendor's key
 * format, e.g. "sk-ant") and the last 4 characters, medium values keep only
 * the last 4, and short values are fully masked.
 */
export function maskProviderSecret(
  value: string | null | undefined
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (value.length >= 24) {
    return `${value.slice(0, 6)}${MASK}${value.slice(-4)}`;
  }
  if (value.length >= 12) {
    return `${MASK}${value.slice(-4)}`;
  }
  return MASK;
}
