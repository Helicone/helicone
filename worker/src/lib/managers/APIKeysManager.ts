import { Env } from "../..";
import { APIKeysStore } from "../db/APIKeysStore";
import {
  getFromCache,
  removeFromCache,
  storeInCache,
} from "../util/cache/secureCache";

export class APIKeysManager {
  constructor(private store: APIKeysStore, private env: Env) {}

  async setAPIKeys() {
    const apiKeys = await this.store.getAPIKeys();
    if (apiKeys) {
      console.log("setting api keys", apiKeys.length);

      await Promise.all(
        apiKeys.map(async (key) => {
          if (key.soft_delete) {
            await removeFromCache(`api_keys_${key.api_key_hash}`, this.env);
          }
          await storeInCache(
            `api_keys_${key.api_key_hash}`,
            key.organization_id,
            this.env
          );
        })
      );
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
