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

  async getSavedQuery(
    id: string
  ): Promise<Result<HqlSavedQuery | null, string>> {
    try {
      const result = await dbExecute<HqlSavedQuery>(
        "SELECT * FROM saved_queries WHERE id = $1 AND organization_id = $2",
        [id, this.authParams.organizationId]
      );
      if (result.error) {
        return err(result.error);
      }

      return ok(result.data?.[0] ?? null);
    } catch (e) {
      return err(String(e));
    }
  }

  async createSavedQuery(
    requestBody: CreateSavedQueryRequest
  ): Promise<Result<HqlSavedQuery[], string>> {
    try {
      const result = await dbExecute<HqlSavedQuery>(
        "INSERT INTO saved_queries (name, sql, organization_id) VALUES ($1, $2, $3) RETURNING id, name, sql, organization_id, created_at, updated_at",
        [requestBody.name, requestBody.sql, this.authParams.organizationId]
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
        "UPDATE saved_queries SET name = $1, sql = $2 WHERE id = $3 and organization_id = $4 RETURNING id, name, sql, organization_id, created_at, updated_at",
        [
          requestBody.name,
          requestBody.sql,
          requestBody.id,
          this.authParams.organizationId,
        ]
      );
      if (result.error || !result.data) {
        return err(result.error);
      }

      return ok(result.data[0]);
    } catch (e) {
      return err(String(e));
    }
  }

  async deleteSavedQuery(id: string): Promise<Result<void, string>> {
    try {
      const result = await dbExecute<void>(
        "DELETE FROM saved_queries WHERE id = $1 AND organization_id = $2",
        [id, this.authParams.organizationId]
      );
      if (result.error) {
        return err(result.error);
      }

      return ok(undefined);
    } catch (e) {
      return err(String(e));
    }
  }
}
