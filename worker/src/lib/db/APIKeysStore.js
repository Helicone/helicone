export class APIKeysStore {
    supabaseClient;
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
    }
    async getAPIKeys() {
        const pageSize = 1000;
        let allData = [];
        let offset = 0;
        while (true) {
            const ONE_DAY_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data, error } = await this.supabaseClient
                .from("helicone_api_keys")
                .select("organization_id, api_key_hash, soft_delete")
                .eq("temp_key", false)
                .neq("api_key_name", "auto-generated-experiment-key")
                .or(`created_at.gte.${ONE_DAY_AGO},updated_at.gte.${ONE_DAY_AGO}`)
                .range(offset, offset + pageSize - 1);
            if (error) {
                return null;
            }
            if (!data || data.length === 0) {
                break;
            }
            allData.push(...data);
            // If we got fewer results than the page size, we've reached the end
            if (data.length < pageSize) {
                break;
            }
            offset += pageSize;
        }
        return allData;
    }
    async getAPIKeyWithFetch(apiKeyHash) {
        const { data, error } = await this.supabaseClient
            .from("helicone_api_keys")
            .select("organization_id, api_key_hash, soft_delete")
            .eq("api_key_hash", apiKeyHash)
            .eq("soft_delete", false);
        if (error) {
            return null;
        }
        if (data.length === 0) {
            return null;
        }
        return data[0];
    }
}
