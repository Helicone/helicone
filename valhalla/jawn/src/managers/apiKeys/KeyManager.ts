import { BaseManager } from "../BaseManager";
import { Result, err, ok } from "../../lib/shared/result";
import { supabaseServer } from "../../lib/db/supabase";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { hashAuth } from "../../utils/hash";
import generateApiKey from "generate-api-key";
import { uuid } from "uuidv4";
import { AuthParams } from "../../lib/db/supabase";
import { Database } from "../../lib/db/database.types";
import { DecryptedProviderKey } from "../VaultManager";

type HashedPasswordRow = {
  hashed_password: string;
};

export class KeyManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  /**
   * Get API keys for an organization
   */
  async getAPIKeys(): Promise<
    Result<Database["public"]["Tables"]["helicone_api_keys"]["Row"][], string>
  > {
    try {
      const queryBuilder = supabaseServer.client
        .from("helicone_api_keys")
        .select("*")
        .eq("soft_delete", false)
        .neq("api_key_name", "auto-generated-experiment-key")
        .eq("temp_key", false)
        .eq("organization_id", this.authParams.organizationId);

      const res = await queryBuilder;

      if (res.error) {
        return err(res.error.message);
      }

      return ok(res.data);
    } catch (error) {
      return err(`Failed to get API keys: ${error}`);
    }
  }

  /**
   * Update an API key's name
   */
  async updateAPIKey(
    apiKeyId: string,
    updateData: { api_key_name: string }
  ): Promise<Result<null, string>> {
    try {
      const { data, error } = await supabaseServer.client
        .from("helicone_api_keys")
        .update({
          api_key_name: updateData.api_key_name,
        })
        .eq("id", apiKeyId)
        .eq("organization_id", this.authParams.organizationId);

      if (error) {
        return err(error.message);
      }

      return ok(data);
    } catch (error) {
      return err(`Failed to update API key: ${error}`);
    }
  }

  /**
   * Soft delete an API key
   */
  async deleteAPIKey(apiKeyId: string): Promise<Result<any, string>> {
    try {
      const { data, error } = await supabaseServer.client
        .from("helicone_api_keys")
        .update({
          soft_delete: true,
        })
        .eq("id", apiKeyId)
        .eq("organization_id", this.authParams.organizationId);

      if (error) {
        return err(error.message);
      }

      return ok(data);
    } catch (error) {
      return err(`Failed to delete API key: ${error}`);
    }
  }

  /**
   * Delete a provider key
   */
  async deleteProviderKey(providerKeyId: string): Promise<Result<any, string>> {
    try {
      const { data, error } = await supabaseServer.client
        .from("provider_keys")
        .delete()
        .eq("id", providerKeyId)
        .eq("org_id", this.authParams.organizationId);

      if (error) {
        return err(error.message);
      }

      return ok(data);
    } catch (error) {
      return err(`Failed to delete provider key: ${error}`);
    }
  }

  /**
   * Create a normal API key
   */
  async createNormalKey(
    keyName: string,
    keyPermissions: "rw" | "r" | "w" = "rw"
  ): Promise<Result<{ id: string; apiKey: string }, string>> {
    try {
      const IS_EU = process.env.AWS_REGION === "eu-west-1";
      const apiKey = `sk-helicone${IS_EU ? "-eu" : ""}-${generateApiKey({
        method: "base32",
        dashes: true,
      }).toString()}`.toLowerCase();

      const organization = await supabaseServer.client
        .from("organization")
        .select("*")
        .eq("id", this.authParams.organizationId)
        .single();

      if (organization.error || !organization.data) {
        return err("Organization not found");
      }

      const res = await supabaseServer.client
        .from("helicone_api_keys")
        .insert({
          api_key_hash: await hashAuth(apiKey),
          user_id: organization.data.owner,
          api_key_name: keyName,
          organization_id: this.authParams.organizationId,
          key_permissions: keyPermissions,
          temp_key: false,
        })
        .select("*")
        .single();

      if (res.error || !res.data?.id) {
        return err("Failed to create API key");
      }

      return ok({
        id: String(res.data.id), // Convert id to string to match expected return type
        apiKey: apiKey,
      });
    } catch (error) {
      return err(`Failed to create normal key: ${error}`);
    }
  }

  /**
   * Get all provider keys for an organization
   */
  async getProviderKeys(): Promise<Result<any[], string>> {
    try {
      const queryBuilder = supabaseServer.client
        .from("provider_keys")
        .select("*")
        .eq("org_id", this.authParams.organizationId)
        .eq("soft_delete", false)
        .order("created_at", { ascending: false });

      const { data, error } = await queryBuilder;

      if (error) {
        return err(`Failed to get provider keys: ${error.message}`);
      }

      return ok(data || []);
    } catch (error) {
      return err(`Failed to get provider keys: ${error}`);
    }
  }

  /**
   * Create a provider key
   */
  async createProviderKey(data: {
    providerName: string;
    providerKeyName: string;
    providerKey: string;
    config: Record<string, string>;
  }): Promise<Result<{ id: string }, string>> {
    try {
      const { providerName, providerKey, providerKeyName } = data;
      // Always use "default" as the key name

      // Check if a key already exists for this provider
      const existingKeys = await supabaseServer.client
        .from("provider_keys")
        .select("id")
        .eq("org_id", this.authParams.organizationId)
        .eq("provider_name", providerName)
        .eq("soft_delete", false);

      // If a key exists, soft delete it first
      if (existingKeys.data && existingKeys.data.length > 0) {
        const existingKeyId = existingKeys.data[0].id;
        const { error: deleteError } = await supabaseServer.client
          .from("provider_keys")
          .update({ soft_delete: true })
          .eq("id", existingKeyId);

        if (deleteError) {
          return err(`Failed to replace existing key: ${deleteError.message}`);
        }
      }

      // Insert the new key
      const insertData = {
        provider_name: providerName,
        provider_key_name: providerKeyName,
        provider_key: providerKey,
        org_id: this.authParams.organizationId,
        soft_delete: false,
        config: data.config,
      };

      const res = await supabaseServer.client
        .from("provider_keys")
        .insert(insertData)
        .select("id")
        .single();

      if (res.error || !res.data?.id) {
        console.log(
          `Failed to create provider key: ${
            res.error?.message
          }, ${JSON.stringify(insertData)}`
        );
        return err(
          `Failed to create provider key: ${
            res.error?.message
          }, ${JSON.stringify(insertData)}`
        );
      }

      return ok({ id: res.data.id });
    } catch (error) {
      return err(`Failed to create provider key2: ${error}`);
    }
  }

  /**
   * Update a provider key
   */
  async updateProviderKey(params: {
    providerKeyId: string;
    providerKey?: string;
  }): Promise<Result<{ id: string }, string>> {
    try {
      const { providerKeyId, providerKey } = params;

      // Verify the key belongs to this organization
      const hasAccess = await this.hasAccessToProviderKey(providerKeyId);
      if (hasAccess.error) {
        return err(hasAccess.error);
      }

      // Update the key
      const result = await supabaseServer.client
        .from("provider_keys")
        .update({
          provider_key: providerKey,
        })
        .eq("id", providerKeyId)
        .select("id")
        .single();

      if (result.error) {
        return err(`Failed to update provider key: ${result.error.message}`);
      }

      return ok({ id: result.data.id });
    } catch (error) {
      return err(`Failed to update provider key: ${error}`);
    }
  }

  /**
   * Get decrypted provider key by ID
   */
  async getDecryptedProviderKeyById(
    providerKeyId: string
  ): Promise<Result<DecryptedProviderKey, string>> {
    const hasAccess = await this.hasAccessToProviderKey(providerKeyId);

    if (hasAccess.error) {
      return err(hasAccess.error);
    }

    try {
      const key = await supabaseServer.client
        .from("decrypted_provider_keys")
        .select(
          "id, org_id, decrypted_provider_key, provider_key_name, provider_name"
        )
        .eq("id", providerKeyId)
        .eq("soft_delete", false)
        .single();

      if (key.error !== null || key.data === null) {
        return err(key.error?.message || "Provider key not found");
      }

      const providerKey: DecryptedProviderKey = {
        id: key.data.id,
        org_id: key.data.org_id,
        provider_key: key.data.decrypted_provider_key,
        provider_name: key.data.provider_name,
        provider_key_name: key.data.provider_key_name,
      };

      return ok(providerKey);
    } catch (error) {
      return err(`Failed to get decrypted provider key: ${error}`);
    }
  }

  private async hasAccessToProviderKey(
    providerKeyId: string
  ): Promise<Result<boolean, string>> {
    const providerKeyResult = await supabaseServer.client
      .from("provider_keys")
      .select("*")
      .eq("id", providerKeyId)
      .eq("org_id", this.authParams.organizationId)
      .single();

    if (providerKeyResult.error || !providerKeyResult.data) {
      return err(providerKeyResult.error?.message || "Provider key not found");
    }

    return ok(true);
  }

  /**
   * Create a proxy key linked to a provider key
   */
  async createProxyKey(data: {
    providerKeyId: string;
    proxyKeyName: string;
    experimentUse?: boolean;
  }): Promise<Result<{ proxyKey: string; proxyKeyId: string }, string>> {
    try {
      const { providerKeyId, proxyKeyName, experimentUse = false } = data;
      const hasAccess = await this.hasAccessToProviderKey(providerKeyId);

      if (hasAccess.error) {
        return err(hasAccess.error);
      }

      const providerKeyResult = await this.getDecryptedProviderKeyById(
        providerKeyId
      );

      if (providerKeyResult.error || !providerKeyResult.data?.id) {
        return err(providerKeyResult.error || "Provider key not found");
      }

      const providerKey = providerKeyResult.data;

      // Ensure org_id matches the requester's organization
      if (providerKey.org_id !== this.authParams.organizationId) {
        return err("Provider key does not belong to this organization");
      }

      // Generate a new proxy key
      const proxyKeyId = uuid();
      const proxyKey = `sk-helicone-proxy-${generateApiKey({
        method: "base32",
        dashes: true,
      }).toString()}-${proxyKeyId}`.toLowerCase();

      const query = `SELECT encode(pgsodium.crypto_pwhash_str($1), 'hex') as hashed_password;`;
      const hashedResult = await dbExecute<HashedPasswordRow>(query, [
        proxyKey,
      ]);

      if (
        hashedResult.error ||
        !hashedResult.data ||
        hashedResult.data.length === 0
      ) {
        return err("Failed to hash proxy key");
      }

      // Fix the insert call by ensuring provider_key_id is a non-null string
      const providerKeyIdSafe = providerKey.id || "";

      const newProxyMapping = await supabaseServer.client
        .from("helicone_proxy_keys")
        .insert({
          org_id: this.authParams.organizationId,
          helicone_proxy_key_name: proxyKeyName,
          helicone_proxy_key: hashedResult.data[0].hashed_password,
          provider_key_id: providerKeyIdSafe,
          experiment_use: experimentUse,
          id: proxyKeyId,
        })
        .select("*")
        .single();

      if (newProxyMapping.error || !newProxyMapping.data) {
        return err(
          `Failed to create proxy key mapping: ${newProxyMapping.error?.message}`
        );
      }

      return ok({
        proxyKey,
        proxyKeyId: newProxyMapping.data.id,
      });
    } catch (error) {
      return err(`Failed to create proxy key: ${error}`);
    }
  }

  /**
   * Create a temporary API key for experiments
   */
  async createTempKey(
    keyName: string = "auto-generated-experiment-key",
    keyPermissions: "rw" | "r" | "w" = "w"
  ): Promise<Result<{ id: string; apiKey: string }, string>> {
    try {
      const IS_EU = process.env.AWS_REGION === "eu-west-1";
      const apiKey = `sk-helicone${IS_EU ? "-eu" : ""}-${generateApiKey({
        method: "base32",
        dashes: true,
      }).toString()}`.toLowerCase();

      const organization = await supabaseServer.client
        .from("organization")
        .select("*")
        .eq("id", this.authParams.organizationId)
        .single();

      if (organization.error || !organization.data) {
        return err("Organization not found");
      }

      const res = await supabaseServer.client
        .from("helicone_api_keys")
        .insert({
          api_key_hash: await hashAuth(apiKey),
          user_id: organization.data.owner,
          api_key_name: keyName,
          organization_id: this.authParams.organizationId,
          key_permissions: keyPermissions,
          temp_key: true,
        })
        .select("*")
        .single();

      if (res.error || !res.data?.id) {
        return err("Failed to create temporary API key");
      }

      return ok({
        id: String(res.data.id),
        apiKey: apiKey,
      });
    } catch (error) {
      return err(`Failed to create temporary key: ${error}`);
    }
  }
}
