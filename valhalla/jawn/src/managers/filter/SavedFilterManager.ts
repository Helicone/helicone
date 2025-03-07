import { AuthParams } from "../../lib/db/supabase";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import {
  FilterExpression,
  serializeFilter,
  deserializeFilter,
} from "../../lib/shared/filters/filterAst";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { err, ok, Result } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";

export interface SavedFilter {
  id: string;
  organization_id: string;
  name?: string;
  filter: any;
  created_at: string;
  last_used: string;
  created_by?: string;
  is_global: boolean;
}

export interface CreateSavedFilterRequest {
  name?: string;
  filter: any;
  is_global?: boolean;
}

export interface UpdateSavedFilterRequest {
  name?: string;
  filter?: any;
  is_global?: boolean;
}

export class SavedFilterManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  async getSavedFilters(): Promise<Result<SavedFilter[], string>> {
    try {
      const query = `
        SELECT * FROM saved_filters
        WHERE organization_id = $1
        ORDER BY last_used DESC
      `;

      const { data, error } = await dbExecute<SavedFilter>(query, [
        this.authParams.organizationId,
      ]);

      if (error) {
        return err(`Error fetching saved filters: ${error}`);
      }

      return ok(data || []);
    } catch (error) {
      return err(`Unexpected error fetching saved filters: ${error}`);
    }
  }

  async getSavedFilterById(id: string): Promise<Result<SavedFilter, string>> {
    try {
      const query = `
        SELECT * FROM saved_filters
        WHERE id = $1 AND organization_id = $2
      `;

      const { data, error } = await dbExecute<SavedFilter>(query, [
        id,
        this.authParams.organizationId,
      ]);

      if (error) {
        return err(`Error fetching saved filter: ${error}`);
      }

      if (!data || data.length === 0) {
        return err("Saved filter not found");
      }

      return ok(data[0]);
    } catch (error) {
      return err(`Unexpected error fetching saved filter: ${error}`);
    }
  }

  async createSavedFilter(
    request: CreateSavedFilterRequest
  ): Promise<Result<{ id: string }, string>> {
    try {
      const query = `
        INSERT INTO saved_filters (
          organization_id, 
          name, 
          filter,
          created_by, 
          is_global
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const { data, error } = await dbExecute<{ id: string }>(query, [
        this.authParams.organizationId,
        request.name,
        request.filter,
        this.authParams.userId,
        request.is_global || false,
      ]);

      if (error) {
        return err(`Error creating saved filter: ${error}`);
      }

      if (!data || data.length === 0) {
        return err("Failed to create saved filter");
      }

      return ok({ id: data[0].id });
    } catch (error) {
      return err(`Unexpected error creating saved filter: ${error}`);
    }
  }

  async updateSavedFilter(
    id: string,
    request: UpdateSavedFilterRequest
  ): Promise<Result<null, string>> {
    try {
      // First check if the filter exists and belongs to the organization
      const filterResult = await this.getSavedFilterById(id);
      if (filterResult.error) {
        return err(filterResult.error);
      }

      // Build the update query dynamically based on what fields are provided
      let updateFields = [];
      let params = [id, this.authParams.organizationId];
      let paramIndex = 3;

      if (request.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        params.push(request.name);
      }

      if (request.filter !== undefined) {
        updateFields.push(`filter = $${paramIndex++}`);
        params.push(request.filter);
      }

      if (request.is_global !== undefined) {
        updateFields.push(`is_global = $${paramIndex++}`);
        // Convert boolean to string to avoid type error
        params.push(String(request.is_global));
      }

      // Always update last_used
      updateFields.push(`last_used = NOW()`);

      if (updateFields.length === 0) {
        return ok(null); // Nothing to update
      }

      const query = `
        UPDATE saved_filters
        SET ${updateFields.join(", ")}
        WHERE id = $1 AND organization_id = $2
      `;

      const { error } = await dbExecute(query, params);

      if (error) {
        return err(`Error updating saved filter: ${error}`);
      }

      return ok(null);
    } catch (error) {
      return err(`Unexpected error updating saved filter: ${error}`);
    }
  }

  async deleteSavedFilter(id: string): Promise<Result<null, string>> {
    try {
      // First check if the filter exists and belongs to the organization
      const filterResult = await this.getSavedFilterById(id);
      if (filterResult.error) {
        return err(filterResult.error);
      }

      const query = `
        DELETE FROM saved_filters
        WHERE id = $1 AND organization_id = $2
      `;

      const { error } = await dbExecute(query, [
        id,
        this.authParams.organizationId,
      ]);

      if (error) {
        return err(`Error deleting saved filter: ${error}`);
      }

      return ok(null);
    } catch (error) {
      return err(`Unexpected error deleting saved filter: ${error}`);
    }
  }

  async updateLastUsed(id: string): Promise<Result<null, string>> {
    try {
      const query = `
        UPDATE saved_filters
        SET last_used = NOW()
        WHERE id = $1 AND organization_id = $2
      `;

      const { error } = await dbExecute(query, [
        id,
        this.authParams.organizationId,
      ]);

      if (error) {
        return err(`Error updating last used timestamp: ${error}`);
      }

      return ok(null);
    } catch (error) {
      return err(`Unexpected error updating last used timestamp: ${error}`);
    }
  }

  // New methods for the AST filter format

  async createAstFilter(
    name: string | undefined,
    filter: FilterExpression,
    isGlobal: boolean = false
  ): Promise<Result<{ id: string }, string>> {
    return this.createSavedFilter({
      name,
      filter: JSON.stringify(filter),
      is_global: isGlobal,
    });
  }

  async updateAstFilter(
    id: string,
    filter: FilterExpression
  ): Promise<Result<null, string>> {
    return this.updateSavedFilter(id, {
      filter: JSON.stringify(filter),
    });
  }

  async getFilterExpression(
    id: string
  ): Promise<Result<FilterExpression, string>> {
    const filterResult = await this.getSavedFilterById(id);
    if (filterResult.error || !filterResult.data) {
      return err(filterResult.error || "Failed to retrieve filter");
    }

    try {
      const filter = filterResult.data;
      return ok(
        deserializeFilter(
          typeof filter.filter === "string"
            ? filter.filter
            : JSON.stringify(filter.filter)
        )
      );
    } catch (error) {
      return err("Failed to parse filter expression");
    }
  }
}
