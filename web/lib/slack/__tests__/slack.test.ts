// Run with: npx tsx --test lib/slack/__tests__/*.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  SLACK_OAUTH_STATE_TTL_MS,
  createSlackOAuthState,
  verifySlackOAuthState,
} from "../oauthState";
import { verifySlackSignature } from "../verifySlackSignature";

describe("Slack OAuth state", () => {
  before(() => {
    process.env.SLACK_OAUTH_STATE_SECRET = "test-state-secret";
  });

  it("round-trips user and org with the matching cookie nonce", () => {
    const created = createSlackOAuthState("user-1", "org-1");
    assert.ok(created);
    assert.deepEqual(verifySlackOAuthState(created.state, created.nonce), {
      userId: "user-1",
      orgId: "org-1",
    });
  });

  it("rejects a missing or different cookie nonce (CSRF / replay from another browser)", () => {
    const created = createSlackOAuthState("user-1", "org-1")!;
    const other = createSlackOAuthState("user-1", "org-1")!;
    assert.equal(verifySlackOAuthState(created.state, undefined), null);
    assert.equal(verifySlackOAuthState(created.state, other.nonce), null);
  });

  it("rejects expired state", () => {
    const now = Date.now();
    const created = createSlackOAuthState("user-1", "org-1", now)!;
    assert.equal(
      verifySlackOAuthState(
        created.state,
        created.nonce,
        now + SLACK_OAUTH_STATE_TTL_MS + 1,
      ),
      null,
    );
  });

  it("rejects tampered payloads and bare org ids", () => {
    const created = createSlackOAuthState("user-1", "org-1")!;
    const [, sig] = created.state.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({
        u: "user-1",
        o: "org-2",
        n: created.nonce,
        e: Date.now() + 60_000,
      }),
    ).toString("base64url");
    assert.equal(
      verifySlackOAuthState(`${forgedPayload}.${sig}`, created.nonce),
      null,
    );
    assert.equal(verifySlackOAuthState("org-1", created.nonce), null);
  });

  it("fails closed without a secret", () => {
    const created = createSlackOAuthState("user-1", "org-1")!;
    delete process.env.SLACK_OAUTH_STATE_SECRET;
    const prevClient = process.env.SLACK_CLIENT_SECRET;
    delete process.env.SLACK_CLIENT_SECRET;
    try {
      assert.equal(createSlackOAuthState("user-1", "org-1"), null);
      assert.equal(verifySlackOAuthState(created.state, created.nonce), null);
    } finally {
      process.env.SLACK_OAUTH_STATE_SECRET = "test-state-secret";
      if (prevClient !== undefined)
        process.env.SLACK_CLIENT_SECRET = prevClient;
    }
  });
});

describe("verifySlackSignature", () => {
  const secret = "8f742231b10e8888abcd99yyyzzz85a5";
  const body = '{"type":"url_verification","challenge":"abc"}';
  const now = 1_700_000_000;
  const sign = (ts: number, b: string) =>
    "v0=" +
    crypto.createHmac("sha256", secret).update(`v0:${ts}:${b}`).digest("hex");

  it("accepts a valid, fresh signature over the raw body", () => {
    assert.equal(
      verifySlackSignature({
        rawBody: Buffer.from(body),
        signature: sign(now, body),
        timestamp: String(now),
        signingSecret: secret,
        nowSeconds: now + 10,
      }),
      true,
    );
  });

  it("rejects stale timestamps (replay window is 5 minutes)", () => {
    assert.equal(
      verifySlackSignature({
        rawBody: body,
        signature: sign(now, body),
        timestamp: String(now),
        signingSecret: secret,
        nowSeconds: now + 5 * 60 + 1,
      }),
      false,
    );
  });

  it("rejects a modified body, wrong secret, or missing headers", () => {
    const sig = sign(now, body);
    const base = { timestamp: String(now), nowSeconds: now };
    assert.equal(
      verifySlackSignature({
        ...base,
        rawBody: body + " ",
        signature: sig,
        signingSecret: secret,
      }),
      false,
    );
    assert.equal(
      verifySlackSignature({
        ...base,
        rawBody: body,
        signature: sig,
        signingSecret: "other",
      }),
      false,
    );
    assert.equal(
      verifySlackSignature({
        ...base,
        rawBody: body,
        signature: undefined,
        signingSecret: secret,
      }),
      false,
    );
    assert.equal(
      verifySlackSignature({
        rawBody: body,
        signature: sig,
        timestamp: undefined,
        signingSecret: secret,
        nowSeconds: now,
      }),
      false,
    );
    assert.equal(
      verifySlackSignature({
        ...base,
        rawBody: body,
        signature: "v0=deadbeef",
        signingSecret: secret,
      }),
      false,
    );
  });
});
