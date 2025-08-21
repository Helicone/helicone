import {
  CreateSavedQueryRequest,
  HqlSavedQuery,
  UpdateSavedQueryRequest,
} from "../controllers/public/heliconeSqlController";
import { AuthParams } from "../packages/common/auth/types";
import { dbExecute } from "../lib/shared/db/dbExecute";
import { ok, Result, isError } from "../packages/common/result";
import { HqlError, HqlErrorCode, hqlError, parseDatabaseError } from "../lib/errors/HqlErrors";

export class HqlQueryManager {
  constructor(private authParams: AuthParams) {}

  async getSavedQueries(): Promise<Result<Array<HqlSavedQuery>, HqlError>> {
    try {
      const result = await dbExecute<HqlSavedQuery>(
        "SELECT * FROM saved_queries WHERE organization_id = $1",
        [this.authParams.organizationId]
      );
      
      if (isError(result)) {
        return hqlError(
          HqlErrorCode.UNEXPECTED_ERROR,
          result.error
        );
      }

      return ok(result.data || []);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return hqlError(
        HqlErrorCode.UNEXPECTED_ERROR,
        errorMessage
      );
    }
  }

  async getSavedQuery(
    id: string
  ): Promise<Result<HqlSavedQuery | null, HqlError>> {
    if (!id) {
      return hqlError(HqlErrorCode.MISSING_QUERY_ID);
    }
    
    try {
      const result = await dbExecute<HqlSavedQuery>(
        "SELECT * FROM saved_queries WHERE id = $1 AND organization_id = $2",
        [id, this.authParams.organizationId]
      );
      
      if (isError(result)) {
        return hqlError(
          HqlErrorCode.UNEXPECTED_ERROR,
          result.error
        );
      }

      const query = result.data?.[0] ?? null;
      if (!query) {
        return hqlError(
          HqlErrorCode.QUERY_NOT_FOUND,
          `Query ID: ${id}`
        );
      }
      
      return ok(query);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return hqlError(
        HqlErrorCode.UNEXPECTED_ERROR,
        errorMessage
      );
    }
  }

  async createSavedQuery(
    requestBody: CreateSavedQueryRequest
  ): Promise<Result<HqlSavedQuery[], HqlError>> {
    // Validate input
    if (!requestBody.name?.trim()) {
      return hqlError(HqlErrorCode.MISSING_QUERY_NAME);
    }
    if (!requestBody.sql?.trim()) {
      return hqlError(HqlErrorCode.MISSING_QUERY_SQL);
    }
    if (requestBody.name.trim().length > 255) {
      return hqlError(HqlErrorCode.QUERY_NAME_TOO_LONG);
    }
    
    try {
      const result = await dbExecute<HqlSavedQuery>(
        "INSERT INTO saved_queries (name, sql, organization_id) VALUES ($1, $2, $3) RETURNING id, name, sql, organization_id, created_at, updated_at",
        [requestBody.name.trim(), requestBody.sql.trim(), this.authParams.organizationId]
      );
      
      if (isError(result)) {
        const errorCode = parseDatabaseError(result.error);
        return hqlError(errorCode, result.error);
      }

      return ok(result.data || []);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return hqlError(
        HqlErrorCode.UNEXPECTED_ERROR,
        errorMessage
      );
    }
  }

  async updateSavedQuery(
    requestBody: UpdateSavedQueryRequest
  ): Promise<Result<HqlSavedQuery, HqlError>> {
    // Validate input
    if (!requestBody.id) {
      return hqlError(HqlErrorCode.MISSING_QUERY_ID);
    }
    if (!requestBody.name?.trim()) {
      return hqlError(HqlErrorCode.MISSING_QUERY_NAME);
    }
    if (!requestBody.sql?.trim()) {
      return hqlError(HqlErrorCode.MISSING_QUERY_SQL);
    }
    if (requestBody.name.trim().length > 255) {
      return hqlError(HqlErrorCode.QUERY_NAME_TOO_LONG);
    }
    
    try {
      const result = await dbExecute<HqlSavedQuery>(
        "UPDATE saved_queries SET name = $1, sql = $2, updated_at = NOW() WHERE id = $3 and organization_id = $4 RETURNING id, name, sql, organization_id, created_at, updated_at",
        [
          requestBody.name.trim(),
          requestBody.sql.trim(),
          requestBody.id,
          this.authParams.organizationId,
        ]
      );
      
      if (isError(result)) {
        const errorCode = parseDatabaseError(result.error);
        return hqlError(errorCode, result.error);
      }
      
      if (!result.data || result.data.length === 0) {
        return hqlError(
          HqlErrorCode.QUERY_NOT_FOUND,
          `Query ID: ${requestBody.id}`
        );
      }

      return ok(result.data[0]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return hqlError(
        HqlErrorCode.UNEXPECTED_ERROR,
        errorMessage
      );
    }
  }

  async deleteSavedQuery(id: string): Promise<Result<void, HqlError>> {
    if (!id) {
      return hqlError(HqlErrorCode.MISSING_QUERY_ID);
    }
    
    try {
      const result = await dbExecute<{ id: string }>(
        "DELETE FROM saved_queries WHERE id = $1 AND organization_id = $2 RETURNING id",
        [id, this.authParams.organizationId]
      );
      
      if (isError(result)) {
        return hqlError(
          HqlErrorCode.UNEXPECTED_ERROR,
          result.error
        );
      }
      
      if (!result.data || result.data.length === 0) {
        return hqlError(
          HqlErrorCode.QUERY_NOT_FOUND,
          `Query ID: ${id}`
        );
      }

      return ok(undefined);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return hqlError(
        HqlErrorCode.UNEXPECTED_ERROR,
        errorMessage
      );
    }
  }
}
