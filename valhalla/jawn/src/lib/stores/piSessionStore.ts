import crypto from "crypto";
import { redisClient } from "../clients/redisClient";
import { dbExecute } from "../shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";

/**
 * Device-link sessions for the Helicone PI display.
 *
 * Flow:
 *  1. The device asks the server for a session id (createPendingSession). The
 *     id is 32 bytes from the CSPRNG; client-chosen ids are never accepted.
 *  2. A signed-in owner/admin links the id to their organization
 *     (linkSession). Each pending id can be linked once.
 *  3. The device redeems the linked id once for a short-lived, write-only key
 *     (redeemSession).
 *
 * Only a SHA-256 of the id is stored.
 */

export const PI_SESSION_TTL_MS = 10 * 60 * 1000;
const PENDING_PREFIX = "pi:pending:";
const LINKED_USER_PREFIX = "pi:user:";

// Fallback for local development without Redis (single process only).
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

async function kvSet(key: string, value: string, ttlMs: number) {
  if (redisClient) {
    await redisClient.set(key, value, "PX", ttlMs);
    return;
  }
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function kvGet(key: string): Promise<string | null> {
  if (redisClient) {
    return await redisClient.get(key);
  }
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

/** Atomically deletes `key`; returns true only for the caller that removed it. */
async function kvClaim(key: string): Promise<boolean> {
  if (redisClient) {
    return (await redisClient.del(key)) === 1;
  }
  const entry = memoryStore.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return false;
  }
  return memoryStore.delete(key);
}

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isValidPiSessionId(sessionId: unknown): sessionId is string {
  return typeof sessionId === "string" && SESSION_ID_PATTERN.test(sessionId);
}

export function hashPiSessionId(sessionId: string): string {
  return crypto.createHash("sha256").update(sessionId).digest("hex");
}

export async function createPendingPiSession(): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString("base64url");
  await kvSet(
    PENDING_PREFIX + hashPiSessionId(sessionId),
    "1",
    PI_SESSION_TTL_MS
  );
  return sessionId;
}

export async function linkPiSession(params: {
  sessionId: string;
  organizationId: string;
  userId: string;
}): Promise<Result<null, string>> {
  if (!isValidPiSessionId(params.sessionId)) {
    return err("Invalid session");
  }
  const hash = hashPiSessionId(params.sessionId);

  // Only server-issued, unexpired, not-yet-linked ids can be linked, and only
  // once (the pending marker is claimed atomically).
  if (!(await kvClaim(PENDING_PREFIX + hash))) {
    return err("Session not found or expired");
  }

  await kvSet(LINKED_USER_PREFIX + hash, params.userId, PI_SESSION_TTL_MS);

  const { error } = await dbExecute(
    `INSERT INTO pi_session (session_id, organization_id) VALUES ($1, $2)`,
    [hash, params.organizationId]
  );
  if (error) {
    return err("Failed to link session");
  }
  return ok(null);
}

export async function redeemPiSession(
  sessionId: string
): Promise<Result<{ organizationId: string; userId: string }, string>> {
  if (!isValidPiSessionId(sessionId)) {
    return err("Session not found");
  }
  const hash = hashPiSessionId(sessionId);
  const cutoff = new Date(Date.now() - PI_SESSION_TTL_MS).toISOString();

  // DELETE ... RETURNING makes redemption single-use even under concurrency.
  const session = await dbExecute<{ organization_id: string }>(
    `DELETE FROM pi_session
     WHERE session_id = $1
     AND created_at > $2
     RETURNING organization_id`,
    [hash, cutoff]
  );
  if (session.error) {
    return err("Failed to look up session");
  }
  const organizationId = session.data?.[0]?.organization_id;
  if (!organizationId) {
    return err("Session not found");
  }

  const userId = await kvGet(LINKED_USER_PREFIX + hash);
  if (!userId) {
    return err("Session not found");
  }
  await kvClaim(LINKED_USER_PREFIX + hash);

  return ok({ organizationId, userId });
}

export async function deleteExpiredPiSessions() {
  return dbExecute(`DELETE FROM pi_session WHERE created_at < $1`, [
    new Date(Date.now() - PI_SESSION_TTL_MS).toISOString(),
  ]);
}
