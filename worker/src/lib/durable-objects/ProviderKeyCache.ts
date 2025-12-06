import { DurableObject } from "cloudflare:workers";
import { ProviderKey, ProviderKeysStore } from "../db/ProviderKeysStore";

interface ProviderKeyRow {
  org_id: string;
  provider: string;
  decrypted_provider_key: string;
  decrypted_provider_secret_key: string | null;
  auth_type: string;
  byok_enabled: number | null;
  config: string | null; // JSON string
  cuid: string;
  cached_at: number;
  ttl: number;
}

// ProviderKeyCache, as a fallback when the KV Namespace fails
// Used for AI Gateway
export class ProviderKeyCache extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS provider_keys (
        org_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        decrypted_provider_key TEXT NOT NULL,
        decrypted_provider_secret_key TEXT,
        auth_type TEXT NOT NULL,
        byok_enabled INTEGER,
        config TEXT,
        cuid TEXT NOT NULL DEFAULT '',
        cached_at INTEGER NOT NULL,
        ttl INTEGER NOT NULL DEFAULT 43200,
        PRIMARY KEY (org_id, provider, cuid)
      );
    `);

    this.ctx.storage.sql.exec(`
      CREATE INDEX IF NOT EXISTS idx_provider_lookup
      ON provider_keys(org_id, provider);
    `);

    this.ctx.storage.sql.exec(`
      CREATE INDEX IF NOT EXISTS idx_cuid_lookup
      ON provider_keys(org_id, cuid);
    `);
  }

  /**
   * Get provider keys from DO cache
   * Returns null if cache is stale or empty
   */
  async getProviderKeys(orgId: string): Promise<ProviderKey[] | null> {
    const keys = this.ctx.storage.sql
      .exec(
        `SELECT * FROM provider_keys WHERE org_id = ? ORDER BY provider, cuid`,
        orgId
      )
      .toArray() as unknown as ProviderKeyRow[];

    if (keys.length === 0) {
      return null;
    }

    const now = Date.now();
    // Check if cache is stale based on the first key's timestamp
    // All keys for an org are cached together, so checking one is sufficient
    const firstKey = keys[0];
    const cacheAge = now - firstKey.cached_at;
    const maxAge = firstKey.ttl * 1000; // Convert seconds to milliseconds

    if (cacheAge > maxAge) {
      // Cache is stale, return null to trigger refresh
      return null;
    }

    // Convert rows to ProviderKey objects
    return keys.map((row) => this.rowToProviderKey(row));
  }

  /**
   * Store provider keys in cache
   */
  async storeProviderKeys(
    orgId: string,
    keys: ProviderKey[]
  ): Promise<void> {
    if (keys.length === 0) {
      // No keys for this org, clear cache
      this.clearCache(orgId);
      return;
    }

    // Update cache in transaction
    this.ctx.storage.transactionSync(() => {
      // Clear old keys for this org
      this.ctx.storage.sql.exec(
        "DELETE FROM provider_keys WHERE org_id = ?",
        orgId
      );

      // Insert fresh keys
      const now = Date.now();
      const ttl = 43200; // 12 hours

      for (const key of keys) {
        this.ctx.storage.sql.exec(
          `INSERT INTO provider_keys (
            org_id, provider, decrypted_provider_key,
            decrypted_provider_secret_key, auth_type, byok_enabled,
            config, cuid, cached_at, ttl
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          orgId,
          key.provider,
          key.decrypted_provider_key,
          key.decrypted_provider_secret_key || null,
          key.auth_type || "key",
          key.byok_enabled !== undefined ? (key.byok_enabled ? 1 : 0) : null,
          key.config ? JSON.stringify(key.config) : null,
          key.cuid || "",
          now,
          ttl
        );
      }
    });
  }

  /**
   * Invalidate specific key
   */
  async invalidateKey(orgId: string, keyCuid: string): Promise<void> {
    this.ctx.storage.sql.exec(
      "DELETE FROM provider_keys WHERE org_id = ? AND cuid = ?",
      orgId,
      keyCuid
    );
  }

  /**
   * Clear all keys for an organization
   */
  async clearCache(orgId: string): Promise<void> {
    this.ctx.storage.sql.exec(
      "DELETE FROM provider_keys WHERE org_id = ?",
      orgId
    );
  }

  private rowToProviderKey(row: ProviderKeyRow): ProviderKey {
    return {
      org_id: row.org_id,
      provider: row.provider as any, // Cast from string to ModelProviderName
      decrypted_provider_key: row.decrypted_provider_key,
      decrypted_provider_secret_key: row.decrypted_provider_secret_key,
      auth_type: row.auth_type as "key" | "session_token",
      byok_enabled: row.byok_enabled !== null ? row.byok_enabled === 1 : null,
      config: row.config ? JSON.parse(row.config) : null,
      cuid: row.cuid === "" ? null : row.cuid,
    };
  }
}
