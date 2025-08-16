import { dbProviderToProvider, providerToDbProvider, } from "@helicone-package/cost/models/providers";
export class ProviderKeysStore {
    supabaseClient;
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
    }
    async getProviderKeys() {
        const { data, error } = await this.supabaseClient
            .from("decrypted_provider_keys_v2")
            .select("org_id, decrypted_provider_key, decrypted_provider_secret_key, auth_type, provider_name, config")
            .eq("soft_delete", false)
            .not("decrypted_provider_key", "is", null);
        if (error) {
            console.error("error getting provider keys", error);
            return null;
        }
        return data
            .map((row) => {
            const provider = dbProviderToProvider(row.provider_name ?? "");
            if (!provider)
                return null;
            return {
                org_id: row.org_id ?? "",
                provider,
                decrypted_provider_key: row.decrypted_provider_key ?? "",
                decrypted_provider_secret_key: row.decrypted_provider_secret_key ?? null,
                auth_type: row.auth_type,
                config: row.config,
            };
        })
            .filter((key) => key !== null);
    }
    async getProviderKeyWithFetch(provider, orgId) {
        const { data, error } = await this.supabaseClient
            .from("decrypted_provider_keys_v2")
            .select("org_id, decrypted_provider_key, decrypted_provider_secret_key, auth_type, provider_name, config")
            .eq("provider_name", providerToDbProvider(provider))
            .eq("org_id", orgId)
            .eq("soft_delete", false);
        if (error || !data || data.length === 0) {
            return null;
        }
        return {
            provider: dbProviderToProvider(data[0].provider_name ?? "") ?? provider,
            org_id: orgId,
            decrypted_provider_key: data[0].decrypted_provider_key ?? "",
            decrypted_provider_secret_key: data[0].decrypted_provider_secret_key ?? null,
            auth_type: data[0].auth_type,
            config: data[0].config,
        };
    }
}
