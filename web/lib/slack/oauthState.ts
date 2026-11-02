import crypto from "crypto";

/**
 * Slack OAuth `state` handling.
 *
 * The state is `<payload>.<signature>` where payload is base64url JSON
 * `{ u: userId, o: orgId, n: nonce, e: expiresAtMs }` and signature is an
 * HMAC-SHA256 over the payload. The nonce is also stored in an httpOnly
 * cookie on the browser that started the flow; the callback requires the
 * cookie to match and then clears it, which makes each state single-use and
 * bound to the browser, user and org that initiated the install.
 */

export const SLACK_OAUTH_NONCE_COOKIE = "helicone_slack_oauth_nonce";
export const SLACK_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export const SLACK_OAUTH_SCOPES =
  "channels:read,groups:read,chat:write,chat:write.public";

type StatePayload = {
  u: string;
  o: string;
  n: string;
  e: number;
};

function getStateSecret(): string | null {
  const dedicated = process.env.SLACK_OAUTH_STATE_SECRET;
  if (dedicated) {
    return dedicated;
  }
  // Fall back to a key derived from the Slack client secret, which every
  // deployment with a working Slack integration already has server-side.
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (clientSecret) {
    return crypto
      .createHash("sha256")
      .update(`helicone-slack-oauth-state:${clientSecret}`)
      .digest("hex");
  }
  return null;
}

function sign(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

export function createSlackOAuthState(
  userId: string,
  orgId: string,
  now: number = Date.now(),
): { state: string; nonce: string } | null {
  const secret = getStateSecret();
  if (!secret) {
    return null;
  }
  const nonce = crypto.randomBytes(32).toString("base64url");
  const payload: StatePayload = {
    u: userId,
    o: orgId,
    n: nonce,
    e: now + SLACK_OAUTH_STATE_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { state: `${encoded}.${sign(encoded, secret)}`, nonce };
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export type VerifiedSlackOAuthState = { userId: string; orgId: string };

/**
 * Verify a state value returned by Slack. Returns the bound user/org, or null
 * if the state is malformed, forged, expired, or not the one this browser
 * started (cookie nonce mismatch).
 */
export function verifySlackOAuthState(
  state: string,
  cookieNonce: string | undefined,
  now: number = Date.now(),
): VerifiedSlackOAuthState | null {
  const secret = getStateSecret();
  if (!secret || !cookieNonce) {
    return null;
  }
  const parts = state.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [encoded, signature] = parts;
  if (!safeEqual(signature, sign(encoded, secret))) {
    return null;
  }

  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    typeof payload?.u !== "string" ||
    typeof payload?.o !== "string" ||
    typeof payload?.n !== "string" ||
    typeof payload?.e !== "number"
  ) {
    return null;
  }
  if (payload.e < now) {
    return null;
  }
  if (!safeEqual(payload.n, cookieNonce)) {
    return null;
  }
  return { userId: payload.u, orgId: payload.o };
}

export function slackNonceCookie(nonce: string, secure: boolean): string {
  return [
    `${SLACK_OAUTH_NONCE_COOKIE}=${nonce}`,
    "Path=/",
    `Max-Age=${Math.floor(SLACK_OAUTH_STATE_TTL_MS / 1000)}`,
    "HttpOnly",
    // Lax: the cookie must survive the top-level GET redirect back from
    // slack.com, but is never sent on cross-site subrequests.
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function clearSlackNonceCookie(secure: boolean): string {
  return [
    `${SLACK_OAUTH_NONCE_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

/**
 * The redirect_uri registered with Slack. Must be identical when building the
 * authorize URL and when exchanging the code, so both sides use this.
 */
export function getSlackRedirectUri(
  host: string | undefined,
  isHttps: boolean,
): string | null {
  if (!host) {
    return null;
  }
  // Slack only accepts https redirect URIs; plain-http local dev goes through
  // redirectmeto.com (same behaviour the client-side link builder had).
  return isHttps
    ? `https://${host}/slack/redirect`
    : `https://redirectmeto.com/http://${host}/slack/redirect`;
}

/** Whether the incoming request reached us over https (directly or via proxy). */
export function isHttpsRequest(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: unknown;
}): boolean {
  const forwarded = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (proto) {
    return proto.split(",")[0].trim().toLowerCase() === "https";
  }
  const socket = req.socket as { encrypted?: boolean } | undefined;
  return socket?.encrypted === true;
}
