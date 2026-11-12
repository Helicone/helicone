import { KeyManager } from "../../../managers/apiKeys/KeyManager";
import { cacheResultCustom } from "../../../utils/cacheResult";
import { KVCache } from "../../cache/kvCache";
import { Result, err, ok } from "../../../packages/common/result";
import { BaseTempKey } from "./baseTempKey";
import { dbExecute } from "../../shared/db/dbExecute";
import { GET_KEY } from "../../clients/constant";

const CACHE_TTL = 60 * 1000 * 30; // 30 minutes

// Temp keys are reused from the cache for up to CACHE_TTL, so only keys well
// past that age are swept. The margin covers the gap between a key's
// created_at and the moment its cache entry is written.
export const TEMP_KEY_SWEEP_AGE_MS = CACHE_TTL * 2;

const kvCache = new KVCache(CACHE_TTL);

/**
 * Soft-deletes expired temporary keys (all organizations). Safe to call
 * often; it only touches temp keys older than TEMP_KEY_SWEEP_AGE_MS.
 */
export async function sweepExpiredTempKeys(now: number = Date.now()) {
  return dbExecute(
    `UPDATE helicone_api_keys
     SET soft_delete = true
     WHERE temp_key = true
     AND soft_delete = false
     AND created_at < $1`,
    [new Date(now - TEMP_KEY_SWEEP_AGE_MS).toISOString()]
  );
}

export class TempHeliconeAPIKey implements BaseTempKey {
  private keyUsed = false;
  private cleanedUp = false;
  constructor(
    private apiKey: string,
    private heliconeApiKeyId: string
  ) {}

  async cleanup() {
    // Runs at most once per instance. (Previously this returned early when the
    // key had been used, so expired temp keys were never swept.)
    if (this.cleanedUp) {
      return;
    }
    this.cleanedUp = true;
    try {
      await sweepExpiredTempKeys();
    } catch (error) {
      console.error("Error sweeping expired temp keys:", error);
    }
  }

  async with<T>(callback: (apiKey: string) => Promise<T>): Promise<T> {
    if (this.keyUsed) {
      throw new Error("Key already used");
    }

    this.keyUsed = true;
    try {
      return await callback(this.apiKey);
    } finally {
      await this.cleanup();
    }
  }
}

export type TempKeyIdentity =
  /** A user is acting (e.g. the playground caller). The key carries them. */
  | { kind: "actor"; userId: string }
  /**
   * Server-internal use only: the key is used by Jawn itself and is NEVER
   * returned to any caller (LLM-as-judge scoring, demo data seeding). There is
   * no human actor, so the key carries the organization owner, which is the
   * identity the organization's own data is attributed to. Every Jawn route
   * that acts as a person requires a JWT, so this stored user id grants no
   * user-level authority.
   */
  | { kind: "server-internal" };

async function resolveTempKeyUserId(
  organizationId: string,
  identity: TempKeyIdentity
): Promise<Result<string, string>> {
  if (identity.kind === "actor") {
    if (!identity.userId || identity.userId.trim() === "") {
      return err("Temporary keys require a user identity");
    }
    return ok(identity.userId);
  }
  const org = await dbExecute<{ owner: string }>(
    `SELECT owner FROM organization WHERE id = $1 AND soft_delete = false LIMIT 1`,
    [organizationId]
  );
  if (org.error || !org.data?.[0]?.owner) {
    return err("Organization not found");
  }
  return ok(org.data[0].owner);
}

export async function generateHeliconeAPIKey(
  organizationId: string,
  identity: TempKeyIdentity,
  keyName?: string,
  keyPermissions?: "rw" | "r" | "w"
): Promise<
  Result<
    {
      apiKey: string;
      heliconeApiKeyId: string;
    },
    string
  >
> {
  try {
    const userId = await resolveTempKeyUserId(organizationId, identity);
    if (userId.error !== null) {
      return err(userId.error);
    }

    const keyManager = new KeyManager({
      userId: userId.data,
      organizationId: organizationId,
    });

    const result = await keyManager.createTempKey(
      keyName ?? "auto-generated-experiment-key",
      keyPermissions ?? "w"
    );

    if (result.error || !result.data) {
      return err(result.error || "Failed to create API key");
    }

    return ok({
      apiKey: result.data.apiKey,
      heliconeApiKeyId: result.data.id,
    });
  } catch (error) {
    return err(`Failed to generate Helicone API Key: ${error}`);
  }
}

/**
 * Returns a write-only temporary key for server-side use. The key itself is
 * never meant to be returned to a client.
 */
export async function generateTempHeliconeAPIKey(
  organizationId: string,
  identity: TempKeyIdentity,
  keyName?: string
): Promise<Result<TempHeliconeAPIKey, string>> {
  const identityCacheKey =
    identity.kind === "actor" ? `actor:${identity.userId}` : "server";
  const apiKey = await cacheResultCustom(
    "generateTempHeliconeAPIKey-" +
      organizationId +
      "-" +
      identityCacheKey +
      "-" +
      (keyName ?? ""),
    async () => await generateHeliconeAPIKey(organizationId, identity, keyName),
    kvCache
  );

  if (apiKey.error) {
    return err(apiKey.error);
  } else {
    return ok(
      new TempHeliconeAPIKey(apiKey.data!.apiKey, apiKey.data!.heliconeApiKeyId)
    );
  }
}

class HeliconeDefaultTempKey {
  constructor(private apiKey: string) {}

  with<T>(callback: (apiKey: string) => Promise<T>): Promise<T> {
    return callback(this.apiKey);
  }
}

export async function getHeliconeDefaultTempKey(
  orgId: string
): Promise<Result<HeliconeDefaultTempKey, string>> {
  const apiKey = await GET_KEY("key:helicone_on_helicone_key");
  if (apiKey.error) {
    return err(`Failed to get Helicone default temp key: ${apiKey.error}`);
  }
  return ok(new HeliconeDefaultTempKey(apiKey));
}
