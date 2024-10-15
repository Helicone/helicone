import { supabaseServer } from "../lib/db/supabase";
import { Result } from "../lib/shared/result";
import { BaseManager } from "./BaseManager";

const KEYS_WHERE_ONLY_ONE_PER_ORG = ["OPEN_PIPE"];

export type DecryptedProviderKey = {
  id: string | null;
  org_id: string | null;
  provider_key: string | null;
  provider_name: string | null;
  provider_key_name: string | null;
};

export class VaultManager extends BaseManager {
  public async addKey(params: {
    key: string;
    provider: string;
    name?: string;
  }): Promise<Result<{ id: string }, string>> {
    try {
      if (KEYS_WHERE_ONLY_ONE_PER_ORG.includes(params.provider)) {
        const { data, error } = await supabaseServer.client
          .from("provider_keys")
          .select("id")
          .eq("org_id", this.authParams.organizationId)
          .eq("provider_name", params.provider)
          .single();
        if (data) {
          return { data: null, error: "Key already exists" };
        }
      }
      const { data, error } = await supabaseServer.client
        .from("provider_keys")
        .insert({
          org_id: this.authParams.organizationId,
          provider_name: params.provider,
          provider_key: params.key,
          provider_key_name: params.name ?? "Untitled",
        })
        .select("id")
        .single();

      if (error) {
        console.error("Failed to insert key into vault", error.message);
        return { data: null, error: error.message };
      }

      return { data: { id: data.id }, error: null };
    } catch (error) {
      console.error("Error adding key to vault:", error);
      return { data: null, error: "Failed to add key to vault" };
    }
  }

  public async getDecryptedProviderKeysByOrgId(): Promise<
    Result<DecryptedProviderKey[], string>
  > {
    try {
      const { data, error } = await supabaseServer.client
        .from("decrypted_provider_keys")
        .select(
          "id, org_id, decrypted_provider_key, provider_key_name, provider_name"
        )
        .eq("org_id", this.authParams.organizationId)
        .eq("soft_delete", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to retrieve provider keys", error.message);
        return { data: null, error: error.message };
      }

      const providerKeys: DecryptedProviderKey[] = data.map((key) => ({
        id: key.id,
        org_id: key.org_id,
        provider_key: key.decrypted_provider_key,
        provider_name: key.provider_name,
        provider_key_name: key.provider_key_name,
      }));

      return { data: providerKeys, error: null };
    } catch (error) {
      console.error("Error retrieving keys from vault:", error);
      return { data: null, error: "Failed to retrieve keys from vault" };
    }
  }

  public async getDecryptedProviderKeyById(
    providerKeyId: string
  ): Promise<Result<DecryptedProviderKey, string>> {
    try {
      const { data, error } = await supabaseServer.client
        .from("decrypted_provider_keys")
        .select(
          "id, org_id, decrypted_provider_key, provider_key_name, provider_name"
        )
        .eq("id", providerKeyId)
        .eq("soft_delete", false)
        .single();

      if (error) {
        console.error("Failed to retrieve provider key", error.message);
        return { data: null, error: error.message };
      }

      const providerKey: DecryptedProviderKey = {
        id: data.id,
        org_id: data.org_id,
        provider_key: data.decrypted_provider_key,
        provider_name: data.provider_name,
        provider_key_name: data.provider_key_name,
      };

      return { data: providerKey, error: null };
    } catch (error) {
      console.error("Error retrieving key from vault:", error);
      return { data: null, error: "Failed to retrieve key from vault" };
    }
  }

  public async updateKey(params: {
    id: string;
    key?: string;
    name?: string;
    active?: boolean;
  }): Promise<Result<null, string>> {
    try {
      const updateData: {
        provider_key?: string;
        provider_key_name?: string;
        active?: boolean;
      } = {};

      if (params.key) {
        updateData.provider_key = params.key;
      }
      if (params.name) {
        updateData.provider_key_name = params.name;
      }
      if (params.active) {
        updateData.active = params.active;
      }

      const { error } = await supabaseServer.client
        .from("provider_keys")
        .update(updateData)
        .eq("id", params.id)
        .eq("org_id", this.authParams.organizationId);

      if (error) {
        console.error("Failed to update key in vault", error.message);
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error("Error updating key in vault:", error);
      return { data: null, error: "Failed to update key in vault" };
    }
  }
}
