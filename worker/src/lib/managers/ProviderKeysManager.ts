import { ProviderName } from "@helicone-package/cost/models/providers";
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
            this.env
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
      this.env
    );
  }

  /*
    UPDATE: Ideally, this is never called since we're
    storing all the keys in an array rather than a single key,
    so when a key is being deleted, we probably should just fetch
    the list again and set the whole thing
  */
  async deleteProviderKey(provider: ProviderName, orgId: string) {
    if (this.env.ENVIRONMENT !== "development") {
      return;
    }
    await removeFromCache(`provider_keys_${provider}_${orgId}`, this.env);
  }

  async getProviderKey(
    provider: ProviderName,
    orgId: string,
    keyCuid?: string
  ): Promise<ProviderKey | null> {
    const keys = await getFromKVCacheOnly(`provider_keys_${orgId}`, this.env);
    if (!keys) {
      return null;
    }

    const data = (JSON.parse(keys) as ProviderKey[]).filter(
      (key) => "provider" in key && key.provider === provider
    );

    if (keyCuid) {
      return data.find((key) => "cuid" in key && key.cuid === keyCuid) ?? null;
    }

    return data.length > 0
      ? // pick a random key if there are multiple keys for the same provider and they haven't mentioned cuid
        data[Math.floor(Math.random() * data.length)]
      : null;
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
