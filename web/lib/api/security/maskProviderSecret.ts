const MASK = "••••••••";

/**
 * Mask a provider secret for display. Mirrors Jawn's `maskProviderSecret`
 * (valhalla/jawn/src/utils/providerKeyAccess.ts) so the dashboard
 * shows the same value regardless of which backend served it.
 *
 * Never returns enough of the value to be usable: long values keep a short
 * prefix (usually just the vendor's key format, e.g. "sk-ant") and the last 4
 * characters, medium values keep only the last 4, short values are fully
 * masked.
 */
export function maskProviderSecret(
  value: string | null | undefined,
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
