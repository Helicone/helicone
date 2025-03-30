import generateApiKey from "generate-api-key";
import { uuid } from "uuidv4";
import { Database } from "../../lib/db/database.types";
import { AuthParams } from "../../lib/db/supabase";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { Result, err, ok } from "../../lib/shared/result";
import { hashAuth } from "../../utils/hash";
import { BaseManager } from "../BaseManager";
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
      const result = await dbExecute<
        Database["public"]["Tables"]["helicone_api_keys"]["Row"]
      >(
        `SELECT *
         FROM helicone_api_keys
         WHERE soft_delete = false
         AND api_key_name != 'auto-generated-experiment-key'
         AND temp_key = false
         AND organization_id = $1`,
        [this.authParams.organizationId]
      );

      if (result.error) {
        return err(result.error);
      }

      return ok(result.data || []);
    } catch (error) {
      return err(`Failed to get API keys: ${error}`);
    }
  }

  /**
   * Update an API key's name
   */
  async updateAPIKey(
    apiKeyId: number,
    updateData: { api_key_name: string }
  ): Promise<Result<null, string>> {
    try {
      const result = await dbExecute(
        `UPDATE helicone_api_keys
         SET api_key_name = $1
         WHERE id = $2
         AND organization_id = $3`,
        [updateData.api_key_name, apiKeyId, this.authParams.organizationId]
      );

      if (result.error) {
        return err(result.error);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to update API key: ${error}`);
    }
  }

  /**
   * Soft delete an API key
   */
  async deleteAPIKey(apiKeyId: number): Promise<Result<any, string>> {
    try {
      const result = await dbExecute(
        `UPDATE helicone_api_keys
         SET soft_delete = true
         WHERE id = $1
         AND organization_id = $2`,
        [apiKeyId, this.authParams.organizationId]
      );

      if (result.error) {
        return err(result.error);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to delete API key: ${error}`);
    }
  }

  /**
   * Delete a provider key
   */
  async deleteProviderKey(providerKeyId: string): Promise<Result<any, string>> {
    try {
      const result = await dbExecute(
        `DELETE FROM provider_keys
         WHERE id = $1
         AND org_id = $2`,
        [providerKeyId, this.authParams.organizationId]
      );

      if (result.error) {
        return err(result.error);
      }

      return ok(null);
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

      // Get organization information
      const orgResult = await dbExecute<{ owner: string }>(
        `SELECT owner
         FROM organization
         WHERE id = $1
         LIMIT 1`,
        [this.authParams.organizationId]
      );

      if (orgResult.error || !orgResult.data || orgResult.data.length === 0) {
        return err("Organization not found");
      }

      const hashedKey = await hashAuth(apiKey);
      const result = await dbExecute<{ id: number }>(
        `INSERT INTO helicone_api_keys (api_key_hash, user_id, api_key_name, organization_id, key_permissions, temp_key)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          hashedKey,
          orgResult.data[0].owner,
          keyName,
          this.authParams.organizationId,
          keyPermissions,
          false,
        ]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err("Failed to create API key");
      }

      return ok({
        id: String(result.data[0].id),
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
      const result = await dbExecute(
        `SELECT *
         FROM provider_keys
         WHERE org_id = $1
         AND soft_delete = false
         ORDER BY created_at DESC`,
        [this.authParams.organizationId]
      );

      if (result.error) {
        return err(`Failed to get provider keys: ${result.error}`);
      }

      return ok(result.data || []);
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
      const { providerName, providerKey, providerKeyName, config } = data;

      // Check if a key already exists for this provider
      const existingKeysResult = await dbExecute<{ id: string }>(
        `SELECT id
         FROM provider_keys
         WHERE org_id = $1
         AND provider_name = $2
         AND soft_delete = false`,
        [this.authParams.organizationId, providerName]
      );

      // If a key exists, soft delete it first
      if (existingKeysResult.data && existingKeysResult.data.length > 0) {
        const existingKeyId = existingKeysResult.data[0].id;
        const deleteResult = await dbExecute(
          `UPDATE provider_keys
           SET soft_delete = true
           WHERE id = $1`,
          [existingKeyId]
        );

        if (deleteResult.error) {
          return err(`Failed to replace existing key: ${deleteResult.error}`);
        }
      }

      // Insert the new key
      const result = await dbExecute<{ id: string }>(
        `INSERT INTO provider_keys (provider_name, provider_key_name, provider_key, org_id, soft_delete, config)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          providerName,
          providerKeyName,
          providerKey,
          this.authParams.organizationId,
          false,
          config,
        ]
      );

      if (result.error || !result.data || result.data.length === 0) {
        console.log(`Failed to create provider key: ${result.error}`);
        return err(`Failed to create provider key: ${result.error}`);
      }

      return ok({ id: result.data[0].id });
    } catch (error) {
      return err(`Failed to create provider key: ${error}`);
    }
  }

  /**
   * Update a provider key
   */
  async updateProviderKey(params: {
    providerKeyId: string;
    providerKey?: string;
    config?: Record<string, string>;
  }): Promise<Result<{ id: string }, string>> {
    try {
      const { providerKeyId, providerKey, config } = params;

      // Verify the key belongs to this organization
      const hasAccess = await this.hasAccessToProviderKey(providerKeyId);
      if (hasAccess.error) {
        return err(hasAccess.error);
      }

      // Build update query dynamically based on provided params
      const updateParts = [];
      const values = [];
      let paramIndex = 1;

      if (providerKey !== undefined) {
        updateParts.push(`provider_key = $${paramIndex++}`);
        values.push(providerKey);
      }

      if (config !== undefined) {
        updateParts.push(`config = $${paramIndex++}`);
        values.push(config);
      }

      if (updateParts.length === 0) {
        return err("No fields to update");
      }

      // Add the WHERE conditions
      values.push(providerKeyId, this.authParams.organizationId);

      // Update the key
      const result = await dbExecute<{ id: string }>(
        `UPDATE provider_keys
         SET ${updateParts.join(", ")}
         WHERE id = $${paramIndex++}
         AND org_id = $${paramIndex}
         RETURNING id`,
        values
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err(`Failed to update provider key: ${result.error}`);
      }

      return ok({ id: result.data[0].id });
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
      const result = await dbExecute<{
        id: string;
        org_id: string;
        decrypted_provider_key: string;
        provider_key_name: string;
        provider_name: string;
      }>(
        `SELECT id, org_id, decrypted_provider_key, provider_key_name, provider_name
         FROM decrypted_provider_keys
         WHERE id = $1
         AND org_id = $2
         AND soft_delete = false
         LIMIT 1`,
        [providerKeyId, this.authParams.organizationId]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err(result.error ?? "Provider key not found");
      }

      const key = result.data[0];
      const providerKey: DecryptedProviderKey = {
        id: key.id,
        org_id: key.org_id,
        provider_key: key.decrypted_provider_key,
        provider_name: key.provider_name,
        provider_key_name: key.provider_key_name,
      };

      return ok(providerKey);
    } catch (error) {
      return err(`Failed to get decrypted provider key: ${error}`);
    }
  }

  private async hasAccessToProviderKey(
    providerKeyId: string
  ): Promise<Result<boolean, string>> {
    try {
      const result = await dbExecute<{ id: string }>(
        `SELECT id
         FROM provider_keys
         WHERE id = $1
         AND org_id = $2
         LIMIT 1`,
        [providerKeyId, this.authParams.organizationId]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err("Provider key not found or no access");
      }

      return ok(true);
    } catch (error) {
      return err(`Error checking access to provider key: ${error}`);
    }
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

      const result = await dbExecute<{ id: string }>(
        `INSERT INTO helicone_proxy_keys (
          org_id, 
          helicone_proxy_key_name, 
          helicone_proxy_key, 
          provider_key_id, 
          experiment_use, 
          id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          this.authParams.organizationId,
          proxyKeyName,
          hashedResult.data[0].hashed_password,
          providerKeyIdSafe,
          experimentUse,
          proxyKeyId,
        ]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err(`Failed to create proxy key mapping: ${result.error}`);
      }

      return ok({
        proxyKey,
        proxyKeyId: result.data[0].id,
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

      // Get organization information
      const orgResult = await dbExecute<{ owner: string }>(
        `SELECT owner
         FROM organization
         WHERE id = $1
         LIMIT 1`,
        [this.authParams.organizationId]
      );

      if (orgResult.error || !orgResult.data || orgResult.data.length === 0) {
        return err("Organization not found");
      }

      const hashedKey = await hashAuth(apiKey);
      const result = await dbExecute<{ id: number }>(
        `INSERT INTO helicone_api_keys (
          api_key_hash, 
          user_id, 
          api_key_name, 
          organization_id, 
          key_permissions, 
          temp_key
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          hashedKey,
          orgResult.data[0].owner,
          keyName,
          this.authParams.organizationId,
          keyPermissions,
          true,
        ]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err("Failed to create temporary API key");
      }

      return ok({
        id: String(result.data[0].id),
        apiKey: apiKey,
      });
    } catch (error) {
      return err(`Failed to create temporary key: ${error}`);
    }
  }
}
