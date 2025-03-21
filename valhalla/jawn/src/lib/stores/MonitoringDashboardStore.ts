import { dbExecute } from "../shared/db/dbExecute";
import { err, ok, PromiseGenericResult } from "../shared/result";
import { BaseStore } from "./baseStore";
import { ChartSelection } from "../../controllers/private/monitoringController";

export interface MonitoringDashboardRecord {
  id: number;
  created_at: string;
  organization_id: string;
  user_id: string;
  config: ChartSelection[];
}

export class MonitoringDashboardStore extends BaseStore {
  constructor(organizationId: string) {
    super(organizationId);
  }

  /**
   * Upsert (create or update) a monitoring dashboard config for a user
   * @param userId The user ID
   * @param config The dashboard configuration
   * @returns Result with the upserted record ID or an error
   */
  public async upsertDashboard(
    userId: string,
    config: ChartSelection[]
  ): PromiseGenericResult<number> {
    const { data, error } = await dbExecute<{ id: number }>(
      `INSERT INTO monitoring_dashboard (organization_id, user_id, config)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id, user_id) 
       DO UPDATE SET config = $3
       RETURNING id`,
      [this.organizationId, userId, JSON.stringify(config)]
    );

    if (error) {
      console.error("Error upserting monitoring dashboard:", error);
      return err("Failed to upsert monitoring dashboard");
    }

    if (!data || data.length === 0) {
      return err("Failed to upsert monitoring dashboard: No ID returned");
    }

    return ok(data[0].id);
  }

  /**
   * Get the monitoring dashboard config for a user
   * @param userId The user ID
   * @returns Result with the dashboard config or an error
   */
  public async getDashboard(
    userId: string
  ): PromiseGenericResult<ChartSelection[]> {
    const { data, error } = await dbExecute<{ config: ChartSelection[] }>(
      `SELECT config
       FROM monitoring_dashboard
       WHERE organization_id = $1 AND user_id = $2
       LIMIT 1`,
      [this.organizationId, userId]
    );

    if (error) {
      console.error("Error getting monitoring dashboard:", error);
      return err("Failed to get monitoring dashboard");
    }

    if (!data || data.length === 0) {
      return ok([]);
    }

    return ok(data[0].config);
  }

  /**
   * Delete the monitoring dashboard config for a user
   * @param userId The user ID
   * @returns Result with success or an error
   */
  public async deleteDashboard(
    userId: string
  ): PromiseGenericResult<null> {
    const { error } = await dbExecute(
      `DELETE FROM monitoring_dashboard
       WHERE organization_id = $1 AND user_id = $2`,
      [this.organizationId, userId]
    );

    if (error) {
      console.error("Error deleting monitoring dashboard:", error);
      return err("Failed to delete monitoring dashboard");
    }

    return ok(null);
  }
}