import { dbExecute } from "../lib/shared/db/dbExecute";
import { Result } from "../packages/common/result";
import { BaseManager } from "./BaseManager";

const KEYS_WHERE_ONLY_ONE_PER_ORG = ["OPEN_PIPE"];

export type DecryptedProviderKey = {
  id: string | null;
  org_id: string | null;
  provider_key: string | null;
  provider_name: string | null;
  provider_key_name: string | null;
  provider_secret_key: string | null;
  cuid?: string | null;
};

export class VaultManager extends BaseManager {
  public async addKey(params: {
    key: string;
    provider: string;
    name?: string;
  }): Promise<Result<{ id: string }, string>> {
    try {
      if (KEYS_WHERE_ONLY_ONE_PER_ORG.includes(params.provider)) {
        const result = await dbExecute<{ id: string }>(
          `SELECT id 
           FROM provider_keys 
           WHERE org_id = $1 
           AND provider_name = $2
           LIMIT 1`,
          [this.authParams.organizationId, params.provider]
        );

        if (result.data && result.data.length > 0) {
          return { data: null, error: "Key already exists" };
        }
      }

      const result = await dbExecute<{ id: string }>(
        `INSERT INTO provider_keys (org_id, provider_name, provider_key, provider_key_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          this.authParams.organizationId,
          params.provider,
          params.key,
          params.name ?? "Untitled",
        ]
      );

      if (result.error || !result.data || result.data.length === 0) {
        console.error("Failed to insert key into vault", result.error);
        return { data: null, error: result.error ?? "Failed to insert key" };
      }

      return { data: { id: result.data[0].id }, error: null };
    } catch (error) {
      console.error("Error adding key to vault:", error);
      return { data: null, error: "Failed to add key to vault" };
    }
  }

  public async getDecryptedProviderKeysByOrgId(): Promise<
    Result<DecryptedProviderKey[], string>
  > {
    try {
      const result = await dbExecute<{
        id: string;
        org_id: string;
        decrypted_provider_key: string;
        provider_key_name: string;
        provider_name: string;
        provider_secret_key: string;
      }>(
        `SELECT id, org_id, decrypted_provider_key, provider_key_name, provider_name, provider_secret_key
         FROM decrypted_provider_keys_v2
         WHERE org_id = $1
         AND soft_delete = false
         ORDER BY created_at DESC`,
        [this.authParams.organizationId]
      );

      if (result.error) {
        console.error("Failed to retrieve provider keys", result.error);
        return { data: null, error: result.error };
      }

      const providerKeys: DecryptedProviderKey[] = (result.data || []).map(
        (key) => ({
          id: key.id,
          org_id: key.org_id,
          provider_key: key.decrypted_provider_key,
          provider_name: key.provider_name,
          provider_key_name: key.provider_key_name,
          provider_secret_key: key.provider_secret_key,
        })
      );

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
      const result = await dbExecute<{
        id: string;
        org_id: string;
        decrypted_provider_key: string;
        provider_key_name: string;
        provider_name: string;
        provider_secret_key: string;
      }>(
        `SELECT id, org_id, decrypted_provider_key, provider_key_name, provider_name, provider_secret_key
         FROM decrypted_provider_keys_v2
         WHERE id = $1
         AND soft_delete = false
         LIMIT 1`,
        [providerKeyId]
      );

      if (result.error || !result.data || result.data.length === 0) {
        console.error("Failed to retrieve provider key", result.error);
        return { data: null, error: result.error ?? "Provider key not found" };
      }

      const key = result.data[0];
      const providerKey: DecryptedProviderKey = {
        id: key.id,
        org_id: key.org_id,
        provider_key: key.decrypted_provider_key,
        provider_name: key.provider_name,
        provider_key_name: key.provider_key_name,
        provider_secret_key: key.provider_secret_key,
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
      // Build the SET part of the query dynamically based on provided params
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (params.key !== undefined) {
        updates.push(`provider_key = $${paramIndex++}`);
        values.push(params.key);
      }
      if (params.name !== undefined) {
        updates.push(`provider_key_name = $${paramIndex++}`);
        values.push(params.name);
      }
      if (params.active !== undefined) {
        updates.push(`active = $${paramIndex++}`);
        values.push(params.active);
      }

      if (updates.length === 0) {
        return { data: null, error: null }; // Nothing to update
      }

      // Add the WHERE condition parameters
      values.push(params.id, this.authParams.organizationId);

      const result = await dbExecute(
        `UPDATE provider_keys
         SET ${updates.join(", ")}
         WHERE id = $${paramIndex++}
         AND org_id = $${paramIndex}`,
        values
      );

      if (result.error) {
        console.error("Failed to update key in vault", result.error);
        return { data: null, error: result.error };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error("Error updating key in vault:", error);
      return { data: null, error: "Failed to update key in vault" };
    }
  }
}
