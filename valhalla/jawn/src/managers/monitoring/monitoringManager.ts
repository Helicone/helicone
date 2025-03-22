import { err, ok, Result } from "../../lib/shared/result";
import { AuthParams } from "../../lib/db/supabase";
import { BaseManager } from "../BaseManager";
import { MonitoringDashboardStore } from "../../lib/stores/MonitoringDashboardStore";
import { ChartSelection } from "../../controllers/private/monitoringController";

export class MonitoringManager extends BaseManager {
  private monitoringDashboardStore: MonitoringDashboardStore;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.monitoringDashboardStore = new MonitoringDashboardStore(authParams.organizationId);
  }

  /**
   * Upsert (create or update) a monitoring dashboard for the current user
   * @param config The dashboard configuration with chart selections
   * @returns Result with success or an error
   */
  public async upsertMonitoringDashboard(
    config: ChartSelection[]
  ): Promise<Result<null, string>> {
    try {
      if (!this.authParams.userId) {
        return err("User ID is required to upsert a monitoring dashboard");
      }

      await this.monitoringDashboardStore.upsertDashboard(
        this.authParams.userId,
        config
      );

      return ok(null);
    } catch (error) {
      console.error("Error upserting monitoring dashboard:", error);
      return err("Failed to upsert monitoring dashboard");
    }
  }

  /**
   * Get the monitoring dashboard configuration for the current user
   * @returns Result with the dashboard config or an error
   */
  public async getMonitoringDashboard(): Promise<Result<ChartSelection[], string>> {
    try {
      if (!this.authParams.userId) {
        return err("User ID is required to get a monitoring dashboard");
      }

      return await this.monitoringDashboardStore.getDashboard(
        this.authParams.userId
      );
    } catch (error) {
      console.error("Error getting monitoring dashboard:", error);
      return err("Failed to get monitoring dashboard");
    }
  }

  /**
   * Delete the monitoring dashboard configuration for the current user
   * @returns Result with success or an error
   */
  public async deleteMonitoringDashboard(): Promise<Result<null, string>> {
    try {
      if (!this.authParams.userId) {
        return err("User ID is required to delete a monitoring dashboard");
      }

      return await this.monitoringDashboardStore.deleteDashboard(
        this.authParams.userId
      );
    } catch (error) {
      console.error("Error deleting monitoring dashboard:", error);
      return err("Failed to delete monitoring dashboard");
    }
  }
}