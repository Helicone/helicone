/**
 * Redacts credentials that callers put in URLs before the URL is logged,
 * traced, or sent to the log pipeline.
 *
 * Google AI Studio historically took `?key=`, Azure SAS URLs carry `sig=`,
 * presigned AWS URLs carry `X-Amz-Signature`/`X-Amz-Credential`, and some
 * clients put Helicone keys in the path. None of these should be stored.
 */
import { containsHeliconeKey } from "./outboundHeaders";

export const REDACTED = "REDACTED";

const SECRET_QUERY_PARAMS = new Set<string>([
  "key",
  "api_key",
  "api-key",
  "apikey",
  "x-api-key",
  "x-goog-api-key",
  "access_token",
  "accesstoken",
  "token",
  "auth",
  "authorization",
  "secret",
  "client_secret",
  "password",
  "sig",
  "signature",
  "x-amz-signature",
  "x-amz-credential",
  "x-amz-security-token",
  "helicone-auth",
]);

export function isSecretQueryParam(name: string): boolean {
  return SECRET_QUERY_PARAMS.has(name.toLowerCase());
}

/**
 * Returns `url` with secret-looking query values and Helicone keys in path
 * segments replaced by REDACTED. Unparseable input is returned with any
 * `key=...`-style pairs masked so a malformed URL cannot smuggle a key past.
 */
export function redactSecretsFromUrl(url: string): string;
export function redactSecretsFromUrl(
  url: string | null | undefined
): string | null | undefined;
export function redactSecretsFromUrl(
  url: string | null | undefined
): string | null | undefined {
  if (url === null || url === undefined || url === "") return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url.replace(
      /([?&;](?:key|api[_-]?key|x-goog-api-key|access_?token|token|sig|signature)=)[^&#;]*/gi,
      `$1${REDACTED}`
    );
  }

  let changed = false;

  const segments = parsed.pathname.split("/");
  const redactedSegments = segments.map((segment) => {
    let decoded = segment;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      // keep raw segment
    }
    if (containsHeliconeKey(decoded)) {
      changed = true;
      return REDACTED;
    }
    return segment;
  });
  if (changed) {
    parsed.pathname = redactedSegments.join("/");
  }

  if (parsed.search) {
    const params = new URLSearchParams(parsed.search);
    let queryChanged = false;
    for (const name of Array.from(new Set(params.keys()))) {
      const values = params.getAll(name);
      if (
        isSecretQueryParam(name) ||
        values.some((value) => containsHeliconeKey(value))
      ) {
        params.delete(name);
        for (let i = 0; i < values.length; i++) {
          params.append(name, REDACTED);
        }
        queryChanged = true;
      }
    }
    if (queryChanged) {
      parsed.search = params.toString();
      changed = true;
    }
  }

  if (parsed.username || parsed.password) {
    parsed.username = "";
    parsed.password = "";
    changed = true;
  }

  return changed ? parsed.toString() : url;
}
