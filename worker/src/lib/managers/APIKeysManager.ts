import { APIKeysStore } from "../db/APIKeysStore";
import {
  getFromKVCacheOnly,
  removeFromCache,
  storeInCache,
} from "../util/cache/secureCache";

export class APIKeysManager {
  constructor(
    private store: APIKeysStore,
    private env: Env
  ) {}

  async setAPIKeys() {
    const apiKeys = await this.store.getAPIKeys();
    if (apiKeys) {

      await Promise.all(
        apiKeys.map(async (key) => {
          if (key.soft_delete) {
            await removeFromCache(`api_keys_${key.api_key_hash}`, this.env);
            return;
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

  async setAPIKey(
    apiKeyHash: string,
    organizationId: string,
    softDelete?: boolean
  ) {
    if (this.env.ENVIRONMENT !== "development") {
      return;
    }
    if (softDelete) {
      await removeFromCache(`api_keys_${apiKeyHash}`, this.env);
      return;
    }
    await storeInCache(`api_keys_${apiKeyHash}`, organizationId, this.env);
  }

  async getAPIKey(apiKeyHash: string): Promise<string | null> {
    const key = await getFromKVCacheOnly(`api_keys_${apiKeyHash}`, this.env);
    if (!key) {
      return null;
    }
    return key;
  }

  /**
   * @returns the organization id or null if the api key is not found
   */
  async getOrgIdWithFetch(apiKeyHash: string): Promise<string | null> {
    const key = await getFromKVCacheOnly(`api_keys_${apiKeyHash}`, this.env);
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
