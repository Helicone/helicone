import { dbExecute } from "../lib/shared/db/dbExecute";
import { Result, err, ok, resultMap } from "../lib/shared/result";
import { BaseManager } from "./BaseManager";

export interface PropertyMetadata {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  property_key: string;
  description: string | null;
  soft_delete: boolean;
  deleted_at: string | null;
}

export interface CreatePropertyMetadataParams {
  property_key: string;
  description?: string;
}

export interface UpdatePropertyMetadataParams {
  description?: string;
  soft_delete?: boolean;
}

export class PropertyMetadataManager extends BaseManager {
  /**
   * Get all property metadata for an organization
   */
  async getAllPropertyMetadata(): Promise<Result<PropertyMetadata[], string>> {
    const { organizationId } = this.authParams;

    const query = `
      SELECT *
      FROM property_metadata
      WHERE organization_id = $1
      ORDER BY property_key ASC
    `;

    return await dbExecute<PropertyMetadata>(query, [organizationId]);
  }

  /**
   * Get property metadata by key
   */
  async getPropertyMetadataByKey(
    propertyKey: string
  ): Promise<Result<PropertyMetadata, string>> {
    const { organizationId } = this.authParams;

    const query = `
      SELECT *
      FROM property_metadata
      WHERE organization_id = $1 AND property_key = $2
      LIMIT 1
    `;

    const result = await dbExecute<PropertyMetadata>(query, [
      organizationId,
      propertyKey,
    ]);

    if (result.error) {
      return { data: null, error: result.error };
    }

    if (result.data && result.data.length === 0) {
      return { data: null, error: "Property metadata not found" };
    }

    return { data: result.data![0], error: null };
  }

  /**
   * Create property metadata
   */
  async createPropertyMetadata(
    params: CreatePropertyMetadataParams
  ): Promise<Result<PropertyMetadata, string>> {
    const { organizationId } = this.authParams;

    const query = `
      INSERT INTO property_metadata (
        organization_id,
        property_key,
        description
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await dbExecute<PropertyMetadata>(query, [
      organizationId,
      params.property_key,
      params.description || null,
    ]);

    if (result.error) {
      return { data: null, error: result.error };
    }

    if (result.data && result.data.length === 0) {
      return { data: null, error: "Failed to create property metadata" };
    }

    return { data: result.data![0], error: null };
  }

  /**
   * Update property metadata
   */
  async updatePropertyMetadata(
    propertyKey: string,
    params: UpdatePropertyMetadataParams
  ): Promise<Result<PropertyMetadata, string>> {
    const { organizationId } = this.authParams;

    // Build the SET clause dynamically based on provided params
    const updates: string[] = [];
    const values: any[] = [organizationId, propertyKey];

    let paramIndex = 3;

    if (params.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(params.description);
    }

    if (params.soft_delete !== undefined) {
      updates.push(`soft_delete = $${paramIndex++}`);
      values.push(params.soft_delete);

      // If soft_delete is true, set deleted_at to now()
      // If soft_delete is false, set deleted_at to null
      if (params.soft_delete) {
        updates.push(`deleted_at = now()`);
      } else {
        updates.push(`deleted_at = NULL`);
      }
    }

    if (updates.length === 0) {
      return { data: null, error: "No updates provided" };
    }

    const query = `
      UPDATE property_metadata
      SET ${updates.join(", ")}, updated_at = now()
      WHERE organization_id = $1 AND property_key = $2
      RETURNING *
    `;

    const result = await dbExecute<PropertyMetadata>(query, values);

    if (result.error) {
      return { data: null, error: result.error };
    }

    if (result.data && result.data.length === 0) {
      return { data: null, error: "Property metadata not found" };
    }

    return { data: result.data![0], error: null };
  }

  /**
   * Delete property metadata
   */
  async deletePropertyMetadata(
    propertyKey: string
  ): Promise<Result<boolean, string>> {
    const { organizationId } = this.authParams;

    const query = `
      DELETE FROM property_metadata
      WHERE organization_id = $1 AND property_key = $2
      RETURNING id
    `;

    const result = await dbExecute<{ id: string }>(query, [
      organizationId,
      propertyKey,
    ]);

    if (result.error) {
      return { data: null, error: result.error };
    }

    if (result.data && result.data.length === 0) {
      return { data: null, error: "Property metadata not found" };
    }

    return { data: true, error: null };
  }
}
