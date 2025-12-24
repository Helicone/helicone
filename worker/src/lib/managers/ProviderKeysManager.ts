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
  constructor(
    private store: ProviderKeysStore,
    private env: Env,
    orgId?: string
  ) {
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
    const start = performance.now();

    if (this.providerKeysFromCache.has(orgId)) {
      const promiseVal = this.providerKeysFromCache.get(orgId);

      if (promiseVal !== undefined) {
        const result = await promiseVal;
        console.log(
          `[PERF] getProviderKeys for ${orgId} - HIT in-memory Promise cache - took ${(performance.now() - start).toFixed(2)}ms`
        );
        return result;
      }
    }

    const kvStart = performance.now();
    const result = await this.getProviderKeysFromCache(
      `provider_keys_${orgId}`
    );
    console.log(
      `[PERF] getProviderKeys for ${orgId} - KV cache lookup took ${(performance.now() - kvStart).toFixed(2)}ms - found: ${!!result}`
    );

    if (result) {
      this.providerKeysFromCache.set(orgId, Promise.resolve(result));
      console.log(
        `[PERF] getProviderKeys for ${orgId} - TOTAL took ${(performance.now() - start).toFixed(2)}ms`
      );
      return result;
    }

    console.log(
      `[PERF] getProviderKeys for ${orgId} - MISS - TOTAL took ${(performance.now() - start).toFixed(2)}ms`
    );
    return null;
  }

  async getProviderKeyWithFetch(
    provider: ModelProviderName,
    providerModelId: string,
    orgId: string,
    keyCuid?: string
  ): Promise<ProviderKey | null> {
    const totalStart = performance.now();

    const cacheStart = performance.now();
    const keys = await this.getProviderKeys(orgId);
    console.log(
      `[PERF] getProviderKeyWithFetch - getProviderKeys(${orgId}) took ${(performance.now() - cacheStart).toFixed(2)}ms - found ${keys?.length ?? 0} keys`
    );

    const chooseStart = performance.now();
    const validKey = this.chooseProviderKey(
      keys ?? [],
      provider,
      providerModelId,
      keyCuid
    );
    console.log(
      `[PERF] getProviderKeyWithFetch - chooseProviderKey(${provider}) took ${(performance.now() - chooseStart).toFixed(2)}ms - found: ${!!validKey}`
    );

    if (!validKey) {
      // Check if we have a sentinel for this provider (means we already checked DB and found nothing)
      if (keys && this.hasSentinelForProvider(keys, provider)) {
        console.log(
          `[PERF] getProviderKeyWithFetch - Found sentinel for ${provider}/${orgId}, skipping DB fetch`
        );
        console.log(
          `[PERF] getProviderKeyWithFetch TOTAL for ${provider}/${orgId} took ${(performance.now() - totalStart).toFixed(2)}ms - returning null (sentinel)`
        );
        return null;
      }

      console.log(
        `[PERF] getProviderKeyWithFetch - No cached key for ${provider}/${orgId}, fetching from DB...`
      );
      const dbStart = performance.now();
      const fetchedKeys = await this.store.getProviderKeysWithFetch(
        provider,
        orgId,
        keyCuid
      );
      console.log(
        `[PERF] getProviderKeyWithFetch - DB fetch for ${provider}/${orgId} took ${(performance.now() - dbStart).toFixed(2)}ms - found: ${!!fetchedKeys}`
      );

      if (!fetchedKeys) {
        const storeNullStart = performance.now();
        const existingKeys = await getFromKVCacheOnly(
          `provider_keys_${orgId}`,
          this.env,
          43200 // 12 hours
        );
        if (existingKeys) {
          const existingKeysData = JSON.parse(existingKeys) as ProviderKey[];
          existingKeysData.push(nullProviderKey(orgId, provider));

          await storeInCache(
            `provider_keys_${orgId}`,
            JSON.stringify(existingKeysData),
            this.env,
            43200 // 12 hours
          );
        } else {
          await storeInCache(
            `provider_keys_${orgId}`,
            JSON.stringify([nullProviderKey(orgId, provider)]),
            this.env,
            43200 // 12 hours
          );
        }
        console.log(
          `[PERF] getProviderKeyWithFetch - Stored null sentinel for ${provider}/${orgId} took ${(performance.now() - storeNullStart).toFixed(2)}ms`
        );
        console.log(
          `[PERF] getProviderKeyWithFetch TOTAL for ${provider}/${orgId} took ${(performance.now() - totalStart).toFixed(2)}ms - returning null`
        );
        return null;
      }

      const storeKeysStart = performance.now();
      const existingKeys = await getFromKVCacheOnly(
        `provider_keys_${orgId}`,
        this.env,
        43200 // 12 hours
      );
      if (existingKeys) {
        const existingKeysData = JSON.parse(existingKeys) as ProviderKey[];
        existingKeysData.push(...fetchedKeys);

        await storeInCache(
          `provider_keys_${orgId}`,
          JSON.stringify(existingKeysData),
          this.env,
          43200 // 12 hours
        );
      } else {
        await storeInCache(
          `provider_keys_${orgId}`,
          JSON.stringify(fetchedKeys),
          this.env,
          43200 // 12 hours
        );
      }
      console.log(
        `[PERF] getProviderKeyWithFetch - Stored fetched keys for ${provider}/${orgId} took ${(performance.now() - storeKeysStart).toFixed(2)}ms`
      );
      const result = this.chooseProviderKey(
        fetchedKeys,
        provider,
        providerModelId,
        keyCuid
      );
      console.log(
        `[PERF] getProviderKeyWithFetch TOTAL for ${provider}/${orgId} took ${(performance.now() - totalStart).toFixed(2)}ms - returning key`
      );
      return result;
    }
    console.log(
      `[PERF] getProviderKeyWithFetch TOTAL for ${provider}/${orgId} took ${(performance.now() - totalStart).toFixed(2)}ms - returning cached key`
    );
    return validKey;
  }
}
