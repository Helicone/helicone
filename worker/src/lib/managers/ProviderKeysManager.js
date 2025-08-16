import { getFromKVCacheOnly, removeFromCache, storeInCache, } from "../util/cache/secureCache";
export class ProviderKeysManager {
    store;
    env;
    constructor(store, env) {
        this.store = store;
        this.env = env;
    }
    async setProviderKeys() {
        const providerKeys = await this.store.getProviderKeys();
        if (providerKeys) {
            await Promise.all(providerKeys.map(async (key) => {
                await storeInCache(`provider_keys_${key.provider}_${key.org_id}`, JSON.stringify(key), this.env);
            }));
        }
        else {
            console.error("No provider keys found");
        }
    }
    async setProviderKey(provider, orgId, key) {
        if (this.env.ENVIRONMENT !== "development") {
            return;
        }
        await storeInCache(`provider_keys_${provider}_${orgId}`, JSON.stringify(key), this.env);
    }
    async deleteProviderKey(provider, orgId) {
        if (this.env.ENVIRONMENT !== "development") {
            return;
        }
        await removeFromCache(`provider_keys_${provider}_${orgId}`, this.env);
    }
    async getProviderKey(provider, orgId) {
        const key = await getFromKVCacheOnly(`provider_keys_${provider}_${orgId}`, this.env);
        if (!key) {
            return null;
        }
        return JSON.parse(key);
    }
    async getProviderKeyWithFetch(provider, orgId) {
        const key = await this.getProviderKey(provider, orgId);
        if (!key) {
            const key = await this.store.getProviderKeyWithFetch(provider, orgId);
            if (!key)
                return null;
            await storeInCache(`provider_keys_${provider}_${orgId}`, JSON.stringify(key), this.env);
            return key;
        }
        return key;
    }
}
