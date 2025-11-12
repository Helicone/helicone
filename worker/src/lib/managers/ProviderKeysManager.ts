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
      const cuidKey = keys.filter(key => key.cuid === keyCuid);
      if (cuidKey.length === 0) {
        return null;
      }
      return cuidKey[0];
    }
    let filteredKeys = keys.filter(key => key.provider === provider);
    
    // For Azure OpenAI, filter by heliconeModelId
    filteredKeys = filteredKeys.filter(key => {
      if (key.config && typeof key.config === 'object' && key.config !== null) {
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
  
  async getProviderKeys(
    orgId: string,
  ): Promise<ProviderKey[] | null> {
    const keys = await getFromKVCacheOnly(
      `provider_keys_${orgId}`,
      this.env,
      43200 // 12 hours
    );
    if (!keys) {
      return null;
    }

    return (JSON.parse(keys) as ProviderKey[]);
    
  }

  async getProviderKeyWithFetch(
    provider: ModelProviderName,
    providerModelId: string,
    orgId: string,
    keyCuid?: string
  ): Promise<ProviderKey | null> {
    const keys = await this.getProviderKeys(orgId);
    const validKey = this.chooseProviderKey(keys ?? [], provider, providerModelId, keyCuid);

    if (!validKey) {
      const keys = await this.store.getProviderKeysWithFetch(
        provider,
        orgId,
        keyCuid
      );

      if (!keys) return null;

      const existingKeys = await getFromKVCacheOnly(
        `provider_keys_${orgId}`,
        this.env,
        43200 // 12 hours
      );
      if (existingKeys) {
        const existingKeysData = JSON.parse(existingKeys) as ProviderKey[];
        existingKeysData.push(...keys);
        await storeInCache(
          `provider_keys_${orgId}`,
          JSON.stringify(existingKeysData),
          this.env,
          43200 // 12 hours
        );
      } else {
        await storeInCache(
          `provider_keys_${orgId}`,
          JSON.stringify(keys),
          this.env,
          43200 // 12 hours
        );
      }
      return this.chooseProviderKey(keys, provider, providerModelId, keyCuid);
    }
    return validKey;
  }
}
