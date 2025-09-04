import generateApiKey from "generate-api-key";
import { uuid } from "uuidv4";
import { Database, Json } from "../../lib/db/database.types";
import { AuthParams } from "../../packages/common/auth/types";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { Result, err, isError, ok } from "../../packages/common/result";
import { hashAuth } from "../../utils/hash";
import { BaseManager } from "../BaseManager";
import { DecryptedProviderKey } from "../VaultManager";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { dbProviderToProvider } from "@helicone-package/cost/models/provider-helpers";
import { setProviderKeys } from "../../lib/refetchKeys";
import { init } from "@paralleldrive/cuid2";
import {
  CreateProviderKeyRequest,
  UpdateProviderKeyRequest,
} from "../../controllers/public/apiKeyController";

export type ProviderKey = {
  providerName: ModelProviderName;
  providerKey: string;
  providerSecretKey?: string;
  providerKeyName: string;
  byokEnabled: boolean;
  config: Json;
  cuid?: string;
};

export interface ProviderKeyRow {
  id: string;
  provider_name: string;
  provider_key_name: string;
  created_at?: string;
  soft_delete: boolean;
  config?: Record<string, any>;
  byok_enabled?: boolean;
  cuid?: string;
}

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
  ): Promise<Result<{ hashedKey: string }, string>> {
    try {
      const result = await dbExecute<{ api_key_hash: string }>(
        `UPDATE helicone_api_keys
         SET api_key_name = $1,
             updated_at = now()
         WHERE id = $2
         AND organization_id = $3 RETURNING api_key_hash`,
        [updateData.api_key_name, apiKeyId, this.authParams.organizationId]
      );

      if (result.error) {
        return err(result.error);
      }

      if (!result.data || result.data.length === 0) {
        return err("API key not found");
      }

      return ok({ hashedKey: result.data[0].api_key_hash });
    } catch (error) {
      return err(`Failed to update API key: ${error}`);
    }
  }

  /**
   * Soft delete an API key
   */
  async deleteAPIKey(
    apiKeyId: number
  ): Promise<Result<{ hashedKey: string }, string>> {
    try {
      const result = await dbExecute<{ api_key_hash: string }>(
        `UPDATE helicone_api_keys
         SET soft_delete = true,
             updated_at = now()
         WHERE id = $1
         AND organization_id = $2 RETURNING api_key_hash`,
        [apiKeyId, this.authParams.organizationId]
      );

      if (result.error) {
        return err(result.error);
      }

      if (!result.data || result.data.length === 0) {
        return err("API key not found");
      }

      return ok({ hashedKey: result.data[0].api_key_hash });
    } catch (error) {
      return err(`Failed to delete API key: ${error}`);
    }
  }

  /**
   * Delete a provider key
   */
  async deleteProviderKey(
    providerKeyId: string
  ): Promise<Result<{ providerName: ModelProviderName | null }, string>> {
    try {
      const providerName = await dbExecute<{ provider_name: string }>(
        `SELECT provider_name
         FROM provider_keys
         WHERE id = $1
         LIMIT 1`,
        [providerKeyId]
      );

      if (
        providerName.error ||
        !providerName.data ||
        providerName.data.length === 0
      ) {
        return err("Provider key not found");
      }

      const provider = dbProviderToProvider(providerName.data[0].provider_name);

      const result = await dbExecute(
        `DELETE FROM provider_keys
         WHERE id = $1
         AND org_id = $2`,
        [providerKeyId, this.authParams.organizationId]
      );

      if (result.error) {
        return err(result.error);
      }

      return ok({ providerName: provider });
    } catch (error) {
      return err(`Failed to delete provider key: ${error}`);
    }
  }

  /**
   * Create a normal API key
   */
  async createNormalKey(
    keyName: string,
    keyPermissions: "rw" | "r" | "w" | "g" = "rw"
  ): Promise<
    Result<{ id: string; apiKey: string; hashedKey: string }, string>
  > {
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
        hashedKey,
      });
    } catch (error) {
      return err(`Failed to create normal key: ${error}`);
    }
  }

  /**
   * Get all provider keys for an organization
   */
  async getProviderKeys(): Promise<Result<ProviderKeyRow[], string>> {
    try {
      const result = await dbExecute<ProviderKeyRow>(
        `SELECT id, org_id, provider_name, provider_key_name, created_at, soft_delete, config, cuid, byok_enabled
         FROM provider_keys
         WHERE org_id = $1
         AND soft_delete = false
         ORDER BY created_at DESC`,
        [this.authParams.organizationId]
      );

      if (isError(result)) {
        return err(`Failed to get provider keys: ${result.error}`);
      }

      return ok(result.data || []);
    } catch (error) {
      return err(`Failed to get provider keys: ${error}`);
    }
  }

  async getDecryptedProviderKeys(): Promise<
    Result<
      {
        id: string;
        org_id: string;
        decrypted_provider_key: string;
        decrypted_provider_secret_key: string | null;
        provider_key_name: string;
        provider_name: string;
        auth_type: "key" | "session_token";
        config: Json | null;
        cuid: string;
        byok_enabled: boolean;
      }[],
      string
    >
  > {
    try {
      const result = await dbExecute<{
        id: string;
        org_id: string;
        decrypted_provider_key: string;
        decrypted_provider_secret_key: string | null;
        provider_key_name: string;
        provider_name: string;
        auth_type: "key" | "session_token";
        config: Json | null;
        cuid: string;
        byok_enabled: boolean;
      }>(
        `SELECT id, org_id, decrypted_provider_key, decrypted_provider_secret_key, provider_key_name, provider_name, auth_type, config, cuid, byok_enabled
         FROM decrypted_provider_keys_v2
         WHERE org_id = $1
         AND soft_delete = false
         AND provider_name IS NOT NULL
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
  async createProviderKey(
    data: CreateProviderKeyRequest
  ): Promise<Result<{ id: string }, string>> {
    try {
      const {
        providerName,
        providerKeyName,
        providerKey,
        providerSecretKey,
        config,
        byokEnabled,
      } = data;

      const createId = init({ length: 12 });

      const providerKeyCUID = createId();

      // Insert the new key
      const result = await dbExecute<{ id: string }>(
        `INSERT INTO provider_keys (provider_name, provider_key_name, provider_key, provider_secret_key, org_id, soft_delete, config, cuid, byok_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          providerName,
          providerKeyName,
          providerKey,
          providerSecretKey,
          this.authParams.organizationId,
          false,
          config,
          providerKeyCUID,
          byokEnabled,
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
    providerSecretKey?: string;
    config?: Record<string, string>;
    byokEnabled?: boolean;
  }): Promise<Result<{ id: string; providerName: string }, string>> {
    try {
      const {
        providerKeyId,
        providerKey,
        providerSecretKey,
        config,
        byokEnabled,
      } = params;

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

      if (providerSecretKey !== undefined) {
        updateParts.push(`provider_secret_key = $${paramIndex++}`);
        values.push(providerSecretKey);
      }

      if (config !== undefined) {
        updateParts.push(`config = $${paramIndex++}`);
        values.push(config);
      }

      if (byokEnabled !== undefined) {
        updateParts.push(`byok_enabled = $${paramIndex++}`);
        values.push(byokEnabled);
      }

      if (updateParts.length === 0) {
        return err("No fields to update");
      }

      // Add the WHERE conditions
      values.push(providerKeyId, this.authParams.organizationId);

      // Update the key
      const result = await dbExecute<{
        id: string;
        provider_name: string;
      }>(
        `UPDATE provider_keys
         SET ${updateParts.join(", ")}
         WHERE id = $${paramIndex++}
         AND org_id = $${paramIndex}
         RETURNING id, provider_name`,
        values
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err(`Failed to update provider key: ${result.error}`);
      }

      return ok({
        id: result.data[0].id,
        providerName: result.data[0].provider_name,
      });
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
        decrypted_provider_secret_key: string | null;
        provider_key_name: string;
        provider_name: string;
        cuid?: string | null;
      }>(
        `SELECT id, org_id, decrypted_provider_key, decrypted_provider_secret_key, provider_key_name, provider_name, provider_secret_key, cuid
         FROM decrypted_provider_keys_v2
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
        provider_secret_key: key.decrypted_provider_secret_key ?? null,
        cuid: key.cuid,
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

      const providerKeyResult =
        await this.getDecryptedProviderKeyById(providerKeyId);

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

  async resetProviderKeysInGatewayCache(): Promise<Result<boolean, string>> {
    try {
      const allProviderKeys = await this.getDecryptedProviderKeys();
      if (allProviderKeys.error) {
        return err(allProviderKeys.error);
      }

      setProviderKeys(
        this.authParams.organizationId,
        allProviderKeys.data
          ?.map((key) => {
            const provider = dbProviderToProvider(key.provider_name ?? "");
            if (!provider) return null;
            return {
              provider,
              decrypted_provider_key: key.decrypted_provider_key,
              decrypted_provider_secret_key:
                key.decrypted_provider_secret_key ?? "",
              auth_type: key.auth_type,
              config: key.config,
              orgId: this.authParams.organizationId,
              cuid: key.cuid,
              byok_enabled: key.byok_enabled,
            };
          })
          .filter((key): key is NonNullable<typeof key> => key !== null) ?? []
      );

      return ok(true);
    } catch (error) {
      return err(`Failed to reset provider keys: ${error}`);
    }
  }
}
