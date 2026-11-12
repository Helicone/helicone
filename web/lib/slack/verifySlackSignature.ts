import crypto from "crypto";

/** Slack rejects (and so do we) requests older than five minutes. */
export const SLACK_SIGNATURE_MAX_AGE_SECONDS = 5 * 60;

/**
 * Verify a Slack request signature per
 * https://api.slack.com/authentication/verifying-requests-from-slack
 *
 * `rawBody` must be the exact bytes Slack sent (not re-serialised JSON).
 * `signature` is the `X-Slack-Signature` header (`v0=<hex>`), `timestamp` the
 * `X-Slack-Request-Timestamp` header (unix seconds).
 */
export function verifySlackSignature({
  rawBody,
  signature,
  timestamp,
  signingSecret,
  nowSeconds = Math.floor(Date.now() / 1000),
}: {
  rawBody: string | Buffer;
  signature: string | undefined;
  timestamp: string | undefined;
  signingSecret: string;
  nowSeconds?: number;
}): boolean {
  if (!signingSecret || !signature || !timestamp) {
    return false;
  }
  if (!/^\d+$/.test(timestamp)) {
    return false;
  }
  const ts = Number(timestamp);
  if (Math.abs(nowSeconds - ts) > SLACK_SIGNATURE_MAX_AGE_SECONDS) {
    return false;
  }
  if (!signature.startsWith("v0=")) {
    return false;
  }

  const body =
    typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
  const expected =
    "v0=" +
    crypto
      .createHmac("sha256", signingSecret)
      .update(Buffer.concat([Buffer.from(`v0:${timestamp}:`, "utf8"), body]))
      .digest("hex");

  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
