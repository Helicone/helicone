import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { ProviderKey, ProviderKeysStore } from "../db/ProviderKeysStore";
import {
  getFromKVCacheOnly,
  InMemoryCache,
  removeFromCache,
  storeInCache,
} from "../util/cache/secureCache";

export class ProviderKeysManager {
  constructor(
    private store: ProviderKeysStore,
    private env: Env
  ) {}

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

  chooseProviderKey(
    keys: ProviderKey[],
    provider: ModelProviderName,
    providerModelId: string,
    keyCuid?: string
  ): ProviderKey | null {
    if (keyCuid) {
      const cuidKey = keys.filter((key) => key.cuid === keyCuid);
      if (cuidKey.length === 0) {
        return null;
      }
      return cuidKey[0];
    }
    let filteredKeys = keys.filter((key) => key.provider === provider);

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

  async getProviderKeys(orgId: string): Promise<ProviderKey[] | null> {
    const kvCacheKey = `provider_keys_${orgId}`;
    const memoryCacheKey = `provider_keys_in_memory_${orgId}`;

    // Check in-memory cache first (fastest)
    const cachedKeys =
      InMemoryCache.getInstance<ProviderKey[]>().get(memoryCacheKey);
    if (cachedKeys) {
      return cachedKeys;
    }

    // Fall back to KV cache
    const kvKeys = await getFromKVCacheOnly(kvCacheKey, this.env, 43200);
    if (!kvKeys) {
      return null;
    }

    // Parse once and store in memory cache for subsequent requests
    const parsedKeys = JSON.parse(kvKeys) as ProviderKey[];
    InMemoryCache.getInstance<ProviderKey[]>().set(memoryCacheKey, parsedKeys);

    return parsedKeys;
  }

  /**
   * Get provider key with read-through cache pattern.
   * Returns cached data immediately, always refreshes in background.
   */
  async getProviderKeyWithFetch(
    provider: ModelProviderName,
    providerModelId: string,
    orgId: string,
    keyCuid?: string,
    ctx?: ExecutionContext
  ): Promise<ProviderKey | null> {
    const cacheKey = `provider_keys_${orgId}`;
    const ttl = 43200; // 12 hours

    // Get cached keys
    const keys = await this.getProviderKeys(orgId);

    // Try to find key from cache
    const validKey = this.chooseProviderKey(
      keys ?? [],
      provider,
      providerModelId,
      keyCuid
    );

    if (validKey) {
      // Cache hit - trigger background refresh and return immediately
      if (ctx) {
        ctx.waitUntil(
          this.fetchAndCacheProviderKey(
            provider,
            providerModelId,
            orgId,
            keyCuid,
            cacheKey,
            ttl
          )
        );
      }
      return validKey;
    }

    // Cache miss - must wait for fetch
    return this.fetchAndCacheProviderKey(
      provider,
      providerModelId,
      orgId,
      keyCuid,
      cacheKey,
      ttl
    );
  }

  /**
   * Fetch provider key from Supabase and update cache.
   * Used both for cache miss (awaited) and background refresh (fire-and-forget).
   */
  private async fetchAndCacheProviderKey(
    provider: ModelProviderName,
    providerModelId: string,
    orgId: string,
    keyCuid: string | undefined,
    cacheKey: string,
    ttl: number
  ): Promise<ProviderKey | null> {
    try {
      const fetchedKeys = await this.store.getProviderKeysWithFetch(
        provider,
        orgId,
        keyCuid
      );

      if (!fetchedKeys || fetchedKeys.length === 0) return null;

      // Merge with existing cache
      const existingCached = await this.getProviderKeys(orgId);
      const existingKeys = existingCached ?? [];

      // Dedupe by cuid (or provider if no cuid)
      const keyMap = new Map<string, ProviderKey>();
      for (const key of existingKeys) {
        const id = key.cuid ?? `${key.provider}`;
        keyMap.set(id, key);
      }
      for (const key of fetchedKeys) {
        const id = key.cuid ?? `${key.provider}`;
        keyMap.set(id, key);
      }

      const mergedKeys = Array.from(keyMap.values());

      await storeInCache(
        cacheKey,
        JSON.stringify(mergedKeys),
        this.env,
        ttl,
        false // Don't use secureCache's memory cache (uses hashed keys)
      );

      // Update our in-memory cache with the merged keys
      InMemoryCache.getInstance<ProviderKey[]>().set(cacheKey, mergedKeys);

      return this.chooseProviderKey(
        fetchedKeys,
        provider,
        providerModelId,
        keyCuid
      );
    } catch (e) {
      console.error(`Failed to fetch/cache provider key for ${orgId}:`, e);
      return null;
    }
  }
}
