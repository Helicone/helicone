import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { ProviderKey, ProviderKeysStore } from "../db/ProviderKeysStore";
import { getFromKVCacheOnly, storeInCache } from "../util/cache/secureCache";

/**
 * Creates a sentinel key to cache when no keys exist for a provider.
 * Prevents repeated DB lookups for providers without keys.
 */
function nullProviderKey(
  orgId: string,
  providerName: ModelProviderName
): ProviderKey {
  return {
    provider: providerName,
    org_id: orgId,
    decrypted_provider_key: "",
    auth_type: "key",
    byok_enabled: false,
    config: null,
    decrypted_provider_secret_key: null,
    cuid: null,
  };
}

export class ProviderKeysManager {
  providerKeysFromCache: Map<string, Promise<ProviderKey[] | null>> = new Map();
  private ctx?: ExecutionContext;

  constructor(
    private store: ProviderKeysStore,
    private env: Env,
    orgId?: string,
    ctx?: ExecutionContext
  ) {
    this.ctx = ctx;

    if (orgId) {
      this.providerKeysFromCache.set(
        orgId,
        this.getProviderKeysFromCache(`provider_keys_${orgId}`)
      );
    }

    this.providerKeysFromCache.set(
      env.HELICONE_ORG_ID,
      this.getProviderKeysFromCache(`provider_keys_${env.HELICONE_ORG_ID}`)
    );
  }

  async setProviderKeys() {
    const providerKeys = await this.store.getProviderKeys();
    if (providerKeys) {
      await Promise.all(
        Object.entries(providerKeys).map(async ([orgId, keys]) => {
          await storeInCache(
            `provider_keys_${orgId}`,
            JSON.stringify(keys),
            this.env,
            43200 // 12 hours
          );
        })
      );
    } else {
      console.error("No provider keys found");
    }
  }

  async setOrgProviderKeys(orgId: string, providerKeys: ProviderKey[]) {
    if (this.env.ENVIRONMENT !== "development") {
      return;
    }
    await storeInCache(
      `provider_keys_${orgId}`,
      JSON.stringify(providerKeys),
      this.env,
      43200 // 12 hours
    );
  }

  /**
   * Check if a null sentinel exists for this provider.
   * A sentinel indicates we already checked the DB and no key exists.
   */
  private hasSentinelForProvider(
    keys: ProviderKey[],
    provider: ModelProviderName
  ): boolean {
    return keys.some(
      (key) => key.provider === provider && key.decrypted_provider_key === ""
    );
  }

  chooseProviderKey(
    keys: ProviderKey[],
    provider: ModelProviderName,
    providerModelId: string,
    keyCuid?: string
  ): ProviderKey | null {
    // Filter out null sentinel keys (empty decrypted_provider_key)
    const validKeys = keys.filter((key) => key.decrypted_provider_key !== "");

    if (keyCuid) {
      const cuidKey = validKeys.filter((key) => key.cuid === keyCuid);
      if (cuidKey.length === 0) {
        return null;
      }
      return cuidKey[0];
    }
    let filteredKeys = validKeys.filter((key) => key.provider === provider);

    // For Azure OpenAI, filter by heliconeModelId
    filteredKeys = filteredKeys.filter((key) => {
      if (key.config && typeof key.config === "object" && key.config !== null) {
        const config = key.config as { heliconeModelId?: string };
        if (config.heliconeModelId) {
          return config.heliconeModelId === providerModelId;
        }
      }
      return true;
    });

    if (filteredKeys.length === 0) {
      return null;
    }

    return filteredKeys[0];
  }

  private async getProviderKeysFromCache(
    kvCacheKey: string
  ): Promise<ProviderKey[] | null> {
    const kvKeys = await getFromKVCacheOnly(kvCacheKey, this.env, 43200);
    if (!kvKeys) {
      return null;
    }
    return JSON.parse(kvKeys) as ProviderKey[];
  }

  async getProviderKeys(orgId: string): Promise<ProviderKey[] | null> {
    if (this.providerKeysFromCache.has(orgId)) {
      const promiseVal = this.providerKeysFromCache.get(orgId);

      if (promiseVal !== undefined) {
        return await promiseVal;
      }
    }

    const result = await this.getProviderKeysFromCache(
      `provider_keys_${orgId}`
    );

    if (result) {
      this.providerKeysFromCache.set(orgId, Promise.resolve(result));
      return result;
    }

    return null;
  }

  /**
   * Store keys in cache, using ctx.waitUntil if available to avoid blocking.
   */
  private storeInCacheAsync(orgId: string, keysToStore: ProviderKey[]): void {
    const cachePromise = storeInCache(
      `provider_keys_${orgId}`,
      JSON.stringify(keysToStore),
      this.env,
      43200 // 12 hours
    );

    if (this.ctx) {
      this.ctx.waitUntil(cachePromise);
    }
    // If no ctx, fire and forget - the cache write will complete eventually
  }

  async getProviderKeyWithFetch(
    provider: ModelProviderName,
    providerModelId: string,
    orgId: string,
    keyCuid?: string
  ): Promise<ProviderKey | null> {
    const keys = await this.getProviderKeys(orgId);

    const validKey = this.chooseProviderKey(
      keys ?? [],
      provider,
      providerModelId,
      keyCuid
    );

    if (!validKey) {
      // Check if we have a sentinel for this provider (means we already checked DB and found nothing)
      if (keys && this.hasSentinelForProvider(keys, provider)) {
        return null;
      }

      const fetchedKeys = await this.store.getProviderKeysWithFetch(
        provider,
        orgId,
        keyCuid
      );

      if (!fetchedKeys) {
        // Store null sentinel asynchronously
        const existingKeys = await getFromKVCacheOnly(
          `provider_keys_${orgId}`,
          this.env,
          43200 // 12 hours
        );
        if (existingKeys) {
          const existingKeysData = JSON.parse(existingKeys) as ProviderKey[];
          // Check if sentinel already exists to avoid duplicates from concurrent requests
          if (!this.hasSentinelForProvider(existingKeysData, provider)) {
            existingKeysData.push(nullProviderKey(orgId, provider));
            this.storeInCacheAsync(orgId, existingKeysData);
          }
        } else {
          this.storeInCacheAsync(orgId, [nullProviderKey(orgId, provider)]);
        }
        return null;
      }

      // Store fetched keys asynchronously
      const existingKeys = await getFromKVCacheOnly(
        `provider_keys_${orgId}`,
        this.env,
        43200 // 12 hours
      );
      if (existingKeys) {
        const existingKeysData = JSON.parse(existingKeys) as ProviderKey[];
        existingKeysData.push(...fetchedKeys);
        this.storeInCacheAsync(orgId, existingKeysData);
      } else {
        this.storeInCacheAsync(orgId, fetchedKeys);
      }

      return this.chooseProviderKey(
        fetchedKeys,
        provider,
        providerModelId,
        keyCuid
      );
    }
    return validKey;
  }
}
