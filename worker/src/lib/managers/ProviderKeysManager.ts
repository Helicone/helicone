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
  async getProviderKey(
    provider: ModelProviderName,
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
      ? // pick the first key if there are multiple keys for the same provider and they haven't mentioned cuid
        data[0]
      : null;
  }

  async getProviderKeyWithFetch(
    provider: ModelProviderName,
    orgId: string,
    keyCuid?: string
  ): Promise<ProviderKey | null> {
    const key = await this.getProviderKey(provider, orgId, keyCuid);

    if (!key) {
      const key = await this.store.getProviderKeyWithFetch(
        provider,
        orgId,
        keyCuid
      );

      if (!key) return null;

      const existingKeys = await getFromKVCacheOnly(
        `provider_keys_${orgId}`,
        this.env
      );
      if (existingKeys) {
        const existingKeysData = JSON.parse(existingKeys) as ProviderKey[];
        existingKeysData.push(key);
        await storeInCache(
          `provider_keys_${orgId}`,
          JSON.stringify(existingKeysData),
          this.env
        );
      } else {
        await storeInCache(
          `provider_keys_${orgId}`,
          JSON.stringify([key]),
          this.env
        );
      }
      return key;
    }
    return key;
  }
}
