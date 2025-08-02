import { Env, Provider } from "../..";
import { ProviderKey, ProviderKeysStore } from "../db/ProviderKeysStore";
import { getFromCache, storeInCache } from "../util/cache/secureCache";

export class ProviderKeysManager {
  constructor(private store: ProviderKeysStore, private env: Env) {}

  async setProviderKeys() {
    const providerKeys = await this.store.getProviderKeys();
    if (providerKeys) {
      for (const key of providerKeys) {
        await storeInCache(
          `provider_keys_${key.provider}_${key.org_id}`,
          JSON.stringify(key),
          this.env
        );
      }
      // await storeInCache(`provider_keys_${provider}`, JSON.stringify(providerKeys), this.env);
    }
  }

  async getProviderKey(
    provider: Provider,
    orgId: string
  ): Promise<ProviderKey | null> {
    const key = await getFromCache(
      `provider_keys_${provider}_${orgId}`,
      this.env
    );
    if (!key) {
      return null;
    }
    console.log("key in cache", key);
    return JSON.parse(key) as ProviderKey;
  }

  async getProviderKeyWithFetch(
    provider: Provider,
    orgId: string
  ): Promise<ProviderKey | null> {
    const key = await this.getProviderKey(provider, orgId);
    if (!key) {
      console.log("no key in cache, fetching from db");
      const key = await this.store.getProviderKeyWithFetch(provider, orgId);
      if (!key) return null;

      await storeInCache(
        `provider_keys_${provider}_${orgId}`,
        JSON.stringify(key),
        this.env
      );
      return key;
    }
    return key;
  }
}
