import { SupabaseClient } from "@supabase/supabase-js";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { Database, Json } from "../../../supabase/database.types";
import { dbProviderToProvider } from "@helicone-package/cost/models/provider-helpers";

export type ProviderKey = {
  provider: ModelProviderName;
  org_id: string;
  decrypted_provider_key: string;
  /*
   * If the provider is AWS Bedrock, we need to store the secret key along with the access key (which will be stored in the decrypted_provider_key)
   * In all other provider cases, this would be null
   */
  decrypted_provider_secret_key: string | null;
  /*
   * If the provider is AWS Bedrock, and the auth_type is "session_token", we store just the session token in the decrypted_provider_key and the decrypted_provider_secret_key is null
   * In all other provider cases, this would be "key"
   */
  auth_type: "key" | "session_token";
  // `null` should default to `true` so that the behavior is backwards compatible
  // with what existed before we added passthrough billing
  byok_enabled: boolean | null;
  config: Json | null;
  cuid?: string | null;
};

export class ProviderKeysStore {
  constructor(private supabaseClient: SupabaseClient<Database>) {}

  async getProviderKeys(): Promise<Record<string, ProviderKey[]> | null> {
    const { data, error } = await this.supabaseClient
      .from("decrypted_provider_keys_v2")
      .select(
        "org_id, decrypted_provider_key, decrypted_provider_secret_key, auth_type, provider_name, config, cuid, byok_enabled"
      )
      .eq("soft_delete", false)
      .not("decrypted_provider_key", "is", null);

    if (error) {
      console.error("error getting provider keys", error);
      return null;
    }

    const finalData = data
      .map((row) => {
        const provider = dbProviderToProvider(row.provider_name ?? "");
        if (!provider) return null;

        return {
          org_id: row.org_id ?? "",
          provider,
          decrypted_provider_key: row.decrypted_provider_key ?? "",
          decrypted_provider_secret_key:
            row.decrypted_provider_secret_key ?? null,
          auth_type: row.auth_type as "key" | "session_token",
          config: row.config,
          cuid: row.cuid ?? null,
          byok_enabled: row.byok_enabled ?? null,
        };
      })
      .filter((key) => key !== null)
      .reduce<Record<string, ProviderKey[]>>((acc, key) => {
        // this case should not happen but fixing types
        if (!key) return acc;

        if (!acc[key.org_id]) {
          acc[key.org_id] = [];
        }
        acc[key.org_id].push(key);
        return acc;
      }, {});

    return finalData;
  }

  async getProviderKeysWithFetch(
    provider: ModelProviderName,
    orgId: string,
    keyCuid?: string
  ): Promise<ProviderKey[] | null> {
    let query = this.supabaseClient
      .from("decrypted_provider_keys_v2")
      .select(
        "org_id, decrypted_provider_key, decrypted_provider_secret_key, auth_type, provider_name, config, cuid, byok_enabled"
      )
      .eq("provider_name", provider)
      .eq("org_id", orgId)
      .eq("soft_delete", false);

    if (keyCuid !== undefined) {
      query = query.eq("cuid", keyCuid);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map((key) => ({
      provider: dbProviderToProvider(key.provider_name ?? "") ?? provider,
      org_id: orgId,
      decrypted_provider_key: key.decrypted_provider_key ?? "",
      decrypted_provider_secret_key: key.decrypted_provider_secret_key ?? null,
      auth_type: key.auth_type as "key" | "session_token",
      byok_enabled: key.byok_enabled ?? null,
      config: key.config,
      cuid: key.cuid,
    }));
  }

  /**
   * Fetch all provider keys for an organization.
   * Used for read-through cache background refresh.
   */
  async getProviderKeysByOrg(orgId: string): Promise<ProviderKey[] | null> {
    const { data, error } = await this.supabaseClient
      .from("decrypted_provider_keys_v2")
      .select(
        "org_id, decrypted_provider_key, decrypted_provider_secret_key, auth_type, provider_name, config, cuid, byok_enabled"
      )
      .eq("org_id", orgId)
      .eq("soft_delete", false)
      .not("decrypted_provider_key", "is", null);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data
      .map((key): ProviderKey | null => {
        const provider = dbProviderToProvider(key.provider_name ?? "");
        if (!provider) return null;

        return {
          provider,
          org_id: orgId,
          decrypted_provider_key: key.decrypted_provider_key ?? "",
          decrypted_provider_secret_key:
            key.decrypted_provider_secret_key ?? null,
          auth_type: key.auth_type as "key" | "session_token",
          byok_enabled: key.byok_enabled ?? null,
          config: key.config,
          cuid: key.cuid ?? null,
        };
      })
      .filter((key): key is ProviderKey => key !== null);
  }
}
