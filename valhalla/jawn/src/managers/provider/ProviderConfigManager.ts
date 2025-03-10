import { BaseManager } from "../BaseManager";
import { Result, err, ok } from "../../lib/shared/result";
import { supabaseServer } from "../../lib/db/supabase";
import { AuthParams } from "../../lib/db/supabase";
import { dbExecute } from "../../lib/shared/db/dbExecute";

interface ProviderConfiguration {
  id: string;
  org_id: string;
  provider_name: string;
  provider_configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
  soft_delete?: boolean;
  provider_keys?: Array<{
    id: string;
    provider_name: string;
    provider_key_name: string;
    provider_configuration_id: string;
  }>;
}

export class ProviderConfigManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  /**
   * Get all provider configurations for an organization
   */
  async getAllProviderConfigurations(): Promise<
    Result<ProviderConfiguration[], string>
  > {
    try {
      // Use dbExecute to run a SQL query directly that joins provider_configurations with provider_keys
      const query = `
        WITH configs AS (
          SELECT
            pc.id,
            pc.org_id,
            pc.provider_name,
            pc.provider_configuration,
            pc.created_at,
            pc.updated_at
          FROM provider_configurations pc
          WHERE pc.org_id = $1 AND pc.soft_delete = false
        )
        SELECT
          c.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pk.id,
                'provider_name', pk.provider_name,
                'provider_key_name', pk.provider_key_name,
                'provider_configuration_id', pk.provider_configuration_id
              )
            ) FILTER (WHERE pk.id IS NOT NULL),
            '[]'::json
          ) as provider_keys
        FROM configs c
        LEFT JOIN provider_keys pk
          ON c.id = pk.provider_configuration_id AND pk.soft_delete = false
        GROUP BY c.id, c.org_id, c.provider_name, c.provider_configuration, c.created_at, c.updated_at
      `;

      const result = await dbExecute<any>(query, [
        this.authParams.organizationId,
      ]);

      if (result.error || !result.data) {
        return err(`Failed to fetch provider configurations: ${result.error}`);
      }

      // Transform the results to our expected format
      const configs = result.data.map((row: any) => {
        // Parse provider_keys only if it's a string, otherwise use it directly
        let providerKeys = row.provider_keys;
        if (typeof providerKeys === "string") {
          try {
            providerKeys = JSON.parse(providerKeys);
          } catch (error) {
            console.error("Error parsing provider_keys:", error);
            providerKeys = [];
          }
        }

        return {
          id: row.id,
          org_id: row.org_id,
          provider_name: row.provider_name,
          provider_configuration: row.provider_configuration,
          created_at: row.created_at,
          updated_at: row.updated_at,
          provider_keys: providerKeys,
        };
      });

      return ok(configs);
    } catch (error) {
      return err(`Failed to fetch provider configurations: ${error}`);
    }
  }

  /**
   * Get a provider configuration by name
   */
  async getProviderConfiguration(
    providerName: string
  ): Promise<Result<ProviderConfiguration, string>> {
    try {
      // Use dbExecute to run a SQL query directly that joins with provider_keys
      const query = `
        WITH config AS (
          SELECT
            pc.id,
            pc.org_id,
            pc.provider_name,
            pc.provider_configuration,
            pc.created_at,
            pc.updated_at
          FROM provider_configurations pc 
          WHERE pc.org_id = $1 AND pc.provider_name = $2 AND pc.soft_delete = false
          LIMIT 1
        )
        SELECT
          c.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pk.id,
                'provider_name', pk.provider_name,
                'provider_key_name', pk.provider_key_name,
                'provider_configuration_id', pk.provider_configuration_id
              )
            ) FILTER (WHERE pk.id IS NOT NULL),
            '[]'::json
          ) as provider_keys
        FROM config c
        LEFT JOIN provider_keys pk
          ON c.id = pk.provider_configuration_id AND pk.soft_delete = false
        GROUP BY c.id, c.org_id, c.provider_name, c.provider_configuration, c.created_at, c.updated_at
      `;

      const result = await dbExecute<any>(query, [
        this.authParams.organizationId,
        providerName,
      ]);

      if (result.error || !result.data || result.data.length === 0) {
        return err(
          `Provider configuration not found: ${result.error || "No results"}`
        );
      }

      // Transform the result to include provider keys
      const config = {
        id: result.data[0].id,
        org_id: result.data[0].org_id,
        provider_name: result.data[0].provider_name,
        provider_configuration: result.data[0].provider_configuration,
        created_at: result.data[0].created_at,
        updated_at: result.data[0].updated_at,
        provider_keys: this.parseProviderKeys(result.data[0].provider_keys),
      };

      return ok(config);
    } catch (error) {
      return err(`Failed to fetch provider configuration: ${error}`);
    }
  }

  /**
   * Create or update a provider configuration
   */
  async upsertProviderConfiguration(
    providerName: string,
    configuration: Record<string, any>
  ): Promise<Result<ProviderConfiguration, string>> {
    try {
      // Check if configuration already exists
      const existingConfig = await this.getProviderConfiguration(providerName);

      const { query, params } =
        existingConfig.error || !existingConfig.data
          ? {
              // Create new configuration
              query: `
              INSERT INTO provider_configurations (org_id, provider_name, provider_configuration)
              VALUES ($1, $2, $3)
              RETURNING *
            `,
              params: [
                this.authParams.organizationId,
                providerName,
                JSON.stringify(configuration),
              ],
            }
          : {
              // Update existing configuration
              query: `
              UPDATE provider_configurations
              SET provider_configuration = $1, updated_at = now()
              WHERE id = $2 AND org_id = $3
              RETURNING *
            `,
              params: [
                JSON.stringify(configuration),
                existingConfig.data.id,
                this.authParams.organizationId,
              ],
            };

      const result = await dbExecute<ProviderConfiguration>(query, params);

      if (result.error || !result.data || result.data.length === 0) {
        return err(
          `Failed to save provider configuration: ${
            result.error || "No results"
          }`
        );
      }

      return ok(result.data[0]);
    } catch (error) {
      return err(`Failed to upsert provider configuration: ${error}`);
    }
  }

  /**
   * Delete a provider configuration
   */
  async deleteProviderConfiguration(
    providerName: string
  ): Promise<Result<boolean, string>> {
    try {
      const query = `
        UPDATE provider_configurations
        SET soft_delete = true, updated_at = now()
        WHERE org_id = $1 AND provider_name = $2
      `;

      const result = await dbExecute<Record<string, any>>(query, [
        this.authParams.organizationId,
        providerName,
      ]);

      if (result.error) {
        return err(`Failed to delete provider configuration: ${result.error}`);
      }

      return ok(true);
    } catch (error) {
      return err(`Failed to delete provider configuration: ${error}`);
    }
  }

  private parseProviderKeys(providerKeys: any): any[] {
    if (!providerKeys) return [];

    if (typeof providerKeys === "string") {
      try {
        return JSON.parse(providerKeys);
      } catch (error) {
        console.error("Error parsing provider_keys:", error);
        return [];
      }
    }

    return Array.isArray(providerKeys) ? providerKeys : [];
  }
}
