import { AlertRequest, AlertResponse } from "../../managers/alert/AlertManager";
import { err, ok, Result } from "../../packages/common/result";
import { Database } from "../db/database.types";
import { dbExecute } from "../shared/db/dbExecute";
import { ALERT_METRIC_DEFINITIONS } from "@helicone-package/filters/alertDefs";

import { BaseStore } from "./baseStore";

export class AlertStore extends BaseStore {
  constructor(organizationId: string) {
    super(organizationId);
  }
  private thirtySecondsInMs = 30 * 1000;
  private oneMonthInMs = 30 * 24 * 60 * 60 * 1000;

  public async getAlerts(): Promise<Result<AlertResponse, string>> {
    try {
      const alertResult = await dbExecute<
        Database["public"]["Tables"]["alert"]["Row"]
      >(
        `SELECT *
         FROM alert
         WHERE org_id = $1
         AND (soft_delete IS NULL OR soft_delete = false)`,
        [this.organizationId]
      );

      const alertHistoryResult = await dbExecute<
        Database["public"]["Tables"]["alert_history"]["Row"]
      >(
        `SELECT *
         FROM alert_history
         WHERE org_id = $1
         AND (soft_delete IS NULL OR soft_delete = false)`,
        [this.organizationId]
      );

      if (alertResult.error) {
        return err(alertResult.error ?? "Failed to fetch alerts");
      }

      if (alertHistoryResult.error) {
        return err(alertHistoryResult.error ?? "Failed to fetch alert history");
      }

      return ok({
        alerts: alertResult.data ?? [],
        history: alertHistoryResult.data ?? [],
      });
    } catch (error) {
      console.error("Error fetching alerts:", error);
      return err(String(error));
    }
  }

  public async createAlert(
    createAlert: AlertRequest
  ): Promise<Result<string, string>> {
    const alert = {
      ...createAlert,
      status: "resolved",
      org_id: this.organizationId,
    };

    const validationResult = this.validateAlertCreate(alert);
    if (validationResult.error) {
      return err(validationResult.error);
    }

    const query = `
      INSERT INTO alert (name, metric, threshold, time_window, emails, slack_channels, org_id, minimum_request_count, status, filter)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    const parameters = [
      alert.name,
      alert.metric,
      alert.threshold,
      alert.time_window,
      alert.emails,
      alert.slack_channels,
      alert.org_id,
      alert.minimum_request_count,
      alert.status,
      createAlert.filter ? JSON.stringify(createAlert.filter) : null,
    ];

    const result = await dbExecute<{ id: string }>(query, parameters);
    if (result.error || !result.data || result.data.length === 0) {
      return err(`Error creating alert: ${result.error}`);
    }
    return ok(result.data[0].id);
  }

  public async deleteAlert(alertId: string): Promise<Result<null, string>> {
    try {
      const result = await dbExecute(
        `UPDATE alert
         SET soft_delete = true
         WHERE id = $1
         AND org_id = $2`,
        [alertId, this.organizationId]
      );

      if (result.error) {
        return err(`Error deleting alert: ${result.error}`);
      }

      return ok(null);
    } catch (error) {
      console.error("Error deleting alert:", error);
      return err(String(error));
    }
  }

  validateAlertCreate(alert: AlertRequest): Result<null, string> {
    // Custom validator for the time period
    const isValidTimePeriod = (value: number) => {
      return value >= this.thirtySecondsInMs && value <= this.oneMonthInMs;
    };

    // Custom validator for email array
    const isValidEmailArray = (emails: string[]) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return (
        Array.isArray(emails) && emails.every((email) => emailRegex.test(email))
      );
    };

    // Validating each field
    if (!alert.name) return { data: null, error: "Name is required" };

    if (typeof alert.threshold !== "number" || alert.threshold <= 0)
      return { data: null, error: "Invalid threshold" };

    if (alert.metric === "cost" && alert.threshold < 0.01)
      return { data: null, error: "Invalid threshold" };

    if (
      alert.metric === "response.status" &&
      (alert.threshold > 100 || alert.threshold <= 0)
    )
      return { data: null, error: "Invalid threshold" };

    if (!isValidTimePeriod(parseInt(alert.time_window)))
      return { data: null, error: "Invalid time_window" };

    const allowedMetrics = ALERT_METRIC_DEFINITIONS.map(def => def.id);
    if (!allowedMetrics.includes(alert.metric))
      return { data: null, error: "Invalid metric" };

    if (!isValidEmailArray(alert.emails))
      return { data: null, error: "Invalid emails" };

    if (alert.emails.length === 0 && alert.slack_channels.length === 0)
      return {
        data: null,
        error: "At least one notification method is required",
      };
    return { data: null, error: null };
  }
}
