import { ProviderName } from "@helicone-package/cost/models/providers";
import { ProviderKey, ProviderKeysStore } from "../db/ProviderKeysStore";
import {
  getFromKVCacheOnly,
  removeFromCache,
  storeInCache,
} from "../util/cache/secureCache";

export class ProviderKeysManager {
  constructor(private store: ProviderKeysStore, private env: Env) {}

  async setProviderKeys() {
    const providerKeys = await this.store.getProviderKeys();
    if (providerKeys) {
      await Promise.all(
        providerKeys.map(async (key) => {
          await storeInCache(
            `provider_keys_${key.provider}_${key.org_id}`,
            JSON.stringify(key),
            this.env
          );
        })
      );
    } else {
      console.error("No provider keys found");
    }
  }

  async setProviderKey(
    provider: ProviderName,
    orgId: string,
    key: ProviderKey
  ) {
    if (this.env.ENVIRONMENT !== "development") {
      return;
    }

    await storeInCache(
      `provider_keys_${provider}_${orgId}`,
      JSON.stringify(key),
      this.env
    );
  }

  async deleteProviderKey(provider: ProviderName, orgId: string) {
    if (this.env.ENVIRONMENT !== "development") {
      return;
    }
    await removeFromCache(`provider_keys_${provider}_${orgId}`, this.env);
  }

  async getProviderKey(
    provider: ProviderName,
    orgId: string
  ): Promise<ProviderKey | null> {
    const key = await getFromKVCacheOnly(
      `provider_keys_${provider}_${orgId}`,
      this.env
    );
    if (!key) {
      return null;
    }
    return JSON.parse(key) as ProviderKey;
  }

  async getProviderKeyWithFetch(
    provider: ProviderName,
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
