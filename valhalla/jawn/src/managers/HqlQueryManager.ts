import {
  CreateSavedQueryRequest,
  HqlSavedQuery,
  UpdateSavedQueryRequest,
} from "../controllers/public/heliconeSqlController";
import { AuthParams } from "../packages/common/auth/types";
import { dbExecute } from "../lib/shared/db/dbExecute";
import { err, ok, Result } from "../packages/common/result";

export class HqlQueryManager {
  constructor(private authParams: AuthParams) {}

  async getSavedQueries(): Promise<Result<Array<HqlSavedQuery>, string>> {
    try {
      const result = await dbExecute<HqlSavedQuery>(
        "SELECT * FROM saved_queries WHERE organization_id = $1",
        [this.authParams.organizationId]
      );
      if (result.error) {
        return err(result.error);
      }

      return ok(result.data || []);
    } catch (e) {
      return err(String(e));
    }
  }

  async createSavedQuery(
    requestBody: CreateSavedQueryRequest
  ): Promise<Result<HqlSavedQuery[], string>> {
    try {
      const result = await dbExecute<HqlSavedQuery>(
        "INSERT INTO saved_queries (name, sql, path, organization_id) VALUES ($1, $2, $3, $4) RETURNING id, name, sql, path, organization_id, created_at, updated_at",
        [
          requestBody.name,
          requestBody.sql,
          requestBody.path,
          this.authParams.organizationId,
        ]
      );
      if (result.error) {
        return err(result.error);
      }

      return ok(result.data || []);
    } catch (e) {
      return err(String(e));
    }
  }

  async updateSavedQuery(
    requestBody: UpdateSavedQueryRequest
  ): Promise<Result<HqlSavedQuery, string>> {
    try {
      const result = await dbExecute<HqlSavedQuery>(
        "UPDATE saved_queries SET name = $1, sql = $2, path = $3 WHERE id = $4 RETURNING id, name, sql, path, organization_id, created_at, updated_at",
        [requestBody.name, requestBody.sql, requestBody.path, requestBody.id]
      );
      if (result.error || !result.data) {
        return err(result.error);
      }

      return ok(result.data[0]);
    } catch (e) {
      return err(String(e));
    }
  }
}
