import { Env } from "../..";
import { APIKeysStore } from "../db/APIKeysStore";
import { getFromCache, storeInCache } from "../util/cache/secureCache";

export class APIKeysManager {
  constructor(private store: APIKeysStore, private env: Env) {}

  async setAPIKeys() {
    const apiKeys = await this.store.getAPIKeys();
    if (apiKeys) {
      for (const key of apiKeys) {
        await storeInCache(
          `api_keys_${key.api_key_hash}`,
          key.organization_id,
          this.env
        );
      }
    }
  }

  async getAPIKey(apiKeyHash: string): Promise<string | null> {
    const key = await getFromCache(`api_keys_${apiKeyHash}`, this.env);
    if (!key) {
      return null;
    }
    return key;
  }

  async getAPIKeyWithFetch(apiKeyHash: string): Promise<string | null> {
    const key = await getFromCache(`api_keys_${apiKeyHash}`, this.env);
    if (!key) {
      const key = await this.store.getAPIKeyWithFetch(apiKeyHash);
      if (!key) {
        return null;
      }
      await storeInCache(
        `api_keys_${apiKeyHash}`,
        key.organization_id,
        this.env
      );
      return key.organization_id;
    }
    return key;
  }
}
