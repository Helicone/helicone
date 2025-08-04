import { Env, Provider } from "../..";
import { ProviderKey, ProviderKeysStore } from "../db/ProviderKeysStore";
import { getFromCache, storeInCache } from "../util/cache/secureCache";

export class ProviderKeysManager {
  constructor(private store: ProviderKeysStore, private env: Env) {}

  async setProviderKeys() {
    const providerKeys = await this.store.getProviderKeys();
    if (providerKeys) {
      console.log("setting provider keys", providerKeys.length);
      await Promise.all(
        providerKeys.map(async (key) => {
          await storeInCache(
            `provider_keys_${key.provider}_${key.org_id}`,
            JSON.stringify(key),
            this.env
          );
        })
      );
      // await storeInCache(`provider_keys_${provider}`, JSON.stringify(providerKeys), this.env);
    } else {
      console.error("No provider keys found");
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
    return JSON.parse(key) as ProviderKey;
  }

  async getProviderKeyWithFetch(
    provider: Provider,
    orgId: string
  ): Promise<ProviderKey | null> {
    const key = await this.getProviderKey(provider, orgId);
    if (!key) {
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
