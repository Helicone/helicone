import { APIKeysStore } from "../db/APIKeysStore";
import {
  getFromKVCacheOnly,
  removeFromCache,
  storeInCache,
} from "../util/cache/secureCache";
import {
  AUTH_CACHE_TTL_SECONDS,
  CACHE_KEY_PREFIXES,
} from "../util/cache/cacheKeys";

const apiKeyCacheKey = (apiKeyHash: string) =>
  `${CACHE_KEY_PREFIXES.apiKeys}${apiKeyHash}`;

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
            await removeFromCache(apiKeyCacheKey(key.api_key_hash), this.env);
            return;
          }
          await storeInCache(
            apiKeyCacheKey(key.api_key_hash),
            key.organization_id,
            this.env,
            AUTH_CACHE_TTL_SECONDS
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
      await removeFromCache(apiKeyCacheKey(apiKeyHash), this.env);
      return;
    }
    await storeInCache(
      apiKeyCacheKey(apiKeyHash),
      organizationId,
      this.env,
      AUTH_CACHE_TTL_SECONDS
    );
  }

  async getAPIKey(apiKeyHash: string): Promise<string | null> {
    const key = await getFromKVCacheOnly(
      apiKeyCacheKey(apiKeyHash),
      this.env,
      AUTH_CACHE_TTL_SECONDS
    );
    if (!key) {
      return null;
    }
    return key;
  }
}
