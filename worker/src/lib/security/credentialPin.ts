/**
 * Pinning for provider credentials that Helicone decrypted on the caller's
 * behalf (vault proxy keys, customer-portal keys, AI Gateway BYOK keys).
 *
 * The caller never sees these keys, so the caller must not be able to choose
 * where they are sent. A request carrying one may only reach the first-party
 * origin of the key's provider (for Azure: the endpoint in the key's config).
 */
import {
  hasFirstPartyEntry,
  isFirstPartyTargetForProvider,
  normalizeVaultProviderName,
} from "@helicone-package/cost/providers/firstPartyOrigins";

export type CredentialSource = "proxy" | "portal" | "byok";

export interface CredentialPin {
  source: CredentialSource;
  /** provider_keys.provider_name (vault) or the ModelProviderName (gateway) */
  providerName: string | null;
  /** provider_keys.config, used for Azure endpoints */
  config: unknown;
  providerKeyId?: string | null;
}

export function describePin(pin: CredentialPin): string {
  const name = normalizeVaultProviderName(pin.providerName) || "unknown";
  return hasFirstPartyEntry(pin.providerName)
    ? `${name} key`
    : `${name} key (no first-party entry; first-party provider hosts only)`;
}

/** True when the pinned credential may be sent to `target`. */
export function isTargetAllowedForPin(
  pin: CredentialPin,
  target: string | URL
): boolean {
  return isFirstPartyTargetForProvider(pin.providerName, pin.config, target);
}

/** 403 for a routing feature that is never available with a vault key. */
export function vaultKeyOverrideRejection(feature: string): Response {
  return new Response(
    JSON.stringify({
      error: "override_not_allowed_for_stored_key",
      message: `${feature} cannot be used with a provider key stored in Helicone (proxy or customer-portal key). Send the request to the provider's standard Helicone endpoint, or use your own provider key.`,
    }),
    {
      status: 403,
      headers: {
        "content-type": "application/json",
        "helicone-error": "true",
      },
    }
  );
}

export function pinnedTargetRejection(
  pin: CredentialPin,
  target: string | URL
): Response {
  let origin = "the requested target";
  try {
    origin = new URL(typeof target === "string" ? target : target.href).origin;
  } catch {
    // keep generic message
  }
  return new Response(
    JSON.stringify({
      error: "target_not_allowed_for_stored_key",
      message: `This request uses a provider key stored in Helicone (${describePin(pin)}). Stored keys can only be sent to their provider's first-party API; ${origin} is not allowed. Target overrides (Helicone-Target-URL, Helicone-OpenAI-Api-Base, helicone-fallbacks) are not supported with stored keys.`,
    }),
    {
      status: 403,
      headers: {
        "content-type": "application/json",
        "helicone-error": "true",
      },
    }
  );
}
