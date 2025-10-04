import { ClickhouseDB, clickhouseDb } from "../db/ClickhouseWrapper";
import {
  PromiseGenericResult,
  Result,
  err,
  ok,
} from "../../packages/common/result";
import { dbExecute } from "../shared/db/dbExecute";
import { Database } from "../db/database.types";

type OrgRateLimitDB = Database["public"]["Tables"]["org_rate_limits"]["Row"];

type CreateOrgRateLimitDB =
  Database["public"]["Tables"]["org_rate_limits"]["Insert"];

type UpdateOrgRateLimitDB = Partial<
  Omit<CreateOrgRateLimitDB, "organization_id">
>;

export class RateLimitStore {
  public async batchInsertRateLimits(
    rateLimitLogs: ClickhouseDB["Tables"]["rate_limit_log_v2"][],
  ): PromiseGenericResult<string> {
    const result = await clickhouseDb.dbInsertClickhouse(
      "rate_limit_log_v2",
      rateLimitLogs,
    );

    if (result.error || !result.data) {
      return err(`Error inserting rate limit logs: ${result.error}`);
    }

    return ok(result.data);
  }

  async getRateLimitsByOrgId(
    organizationId: string,
  ): Promise<Result<OrgRateLimitDB[], string>> {
    const query = `
          SELECT * FROM org_rate_limits
          WHERE organization_id = $1
          AND deleted_at IS NULL
          ORDER BY created_at DESC
      `;
    return await dbExecute<OrgRateLimitDB>(query, [organizationId]);
  }

  async createRateLimit(
    params: CreateOrgRateLimitDB,
  ): Promise<Result<OrgRateLimitDB, string>> {
    const query = `
          INSERT INTO org_rate_limits (
              organization_id, name, quota, window_seconds, unit, segment
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
      `;
    const result = await dbExecute<OrgRateLimitDB>(query, [
      params.organization_id,
      params.name,
      params.quota,
      params.window_seconds,
      params.unit,
      params.segment,
    ]);
    if (result.error || !result.data || result.data.length === 0) {
      return err(result.error || "Failed to create rate limit rule");
    }
    return ok(result.data[0]);
  }

  async updateRateLimit(
    ruleId: string,
    organizationId: string,
    params: UpdateOrgRateLimitDB,
  ): Promise<Result<OrgRateLimitDB, string>> {
    const fieldsToUpdate = Object.entries(params).filter(
      ([_, value]) => value !== undefined,
    );
    if (fieldsToUpdate.length === 0) {
      return err("No fields provided for update.");
    }

    const setClause = fieldsToUpdate
      .map(([key], index) => `"${key}" = $${index + 3}`)
      .join(", ");
    const values = fieldsToUpdate.map(([_, value]) => value);

    const query = `
          UPDATE org_rate_limits
          SET ${setClause}
          WHERE id = $1
          AND organization_id = $2
          AND deleted_at IS NULL
          RETURNING *
      `;

    const result = await dbExecute<OrgRateLimitDB>(query, [
      ruleId,
      organizationId,
      ...values,
    ]);

    if (result.error || !result.data || result.data.length === 0) {
      return err(
        result.error || "Failed to update rate limit rule or rule not found",
      );
    }
    return ok(result.data[0]);
  }

  async softDeleteRateLimit(
    ruleId: string,
    organizationId: string,
  ): Promise<Result<null, string>> {
    const query = `
          UPDATE org_rate_limits
          SET deleted_at = NOW()
          WHERE id = $1
          AND organization_id = $2
          AND deleted_at IS NULL
      `;
    const result = await dbExecute<OrgRateLimitDB>(query, [
      ruleId,
      organizationId,
    ]); // Check result.data for affected rows

    if (result.error) {
      return err(result.error);
    }

    if (!result.data || result.data.length === 0) {
      // If RETURNING * was used and no rows returned, or if rowCount is available and 0
      return err("Rate limit rule not found or already deleted");
    }

    return ok(null);
  }
}
