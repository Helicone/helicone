import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { ProviderKey, ProviderKeysStore } from "../db/ProviderKeysStore";
import {
  getFromKVCacheOnly,
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
    const keys = await getFromKVCacheOnly(
      `provider_keys_${orgId}`,
      this.env,
      43200 // 12 hours
    );
    if (!keys) {
      return null;
    }

    return JSON.parse(keys) as ProviderKey[];
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

    // Always trigger background refresh if ctx is available (read-through cache)
    if (ctx) {
      ctx.waitUntil(this.refreshProviderKeysInBackground(orgId, cacheKey, ttl));
    }

    // Try to find key from cache
    const validKey = this.chooseProviderKey(
      keys ?? [],
      provider,
      providerModelId,
      keyCuid
    );

    if (validKey) {
      return validKey;
    }

    // Cache miss for this specific key - must wait for fetch
    const fetchedKeys = await this.store.getProviderKeysWithFetch(
      provider,
      orgId,
      keyCuid
    );

    if (!fetchedKeys) return null;

    // Merge with existing cache and store
    const existingKeys = keys ?? [];
    const mergedKeys = [...existingKeys, ...fetchedKeys];

    await storeInCache(
      cacheKey,
      JSON.stringify(mergedKeys),
      this.env,
      ttl,
      false // Don't use memory cache to avoid test contamination
    );

    return this.chooseProviderKey(fetchedKeys, provider, providerModelId, keyCuid);
  }

  /**
   * Background refresh of provider keys cache.
   * Called via ctx.waitUntil() to not block the request.
   */
  private async refreshProviderKeysInBackground(
    orgId: string,
    cacheKey: string,
    ttl: number
  ): Promise<void> {
    try {
      const keys = await this.store.getProviderKeysByOrg(orgId);
      if (keys && keys.length > 0) {
        await storeInCache(
          cacheKey,
          JSON.stringify(keys),
          this.env,
          ttl,
          false // Don't use memory cache
        );
      }
    } catch (e) {
      console.error(`Background refresh failed for provider keys ${orgId}:`, e);
    }
  }
}
