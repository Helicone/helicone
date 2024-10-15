import { AlertResponse, AlertRequest } from "../../managers/alert/AlertManager";
import { Database } from "../db/database.types";
import { supabaseServer } from "../db/supabase";
import { dbExecute } from "../shared/db/dbExecute";
import { err, ok, Result } from "../shared/result";
import { BaseStore } from "./baseStore";

export class AlertStore extends BaseStore {
  constructor(organizationId: string) {
    super(organizationId);
  }
  private thirtySecondsInMs = 30 * 1000;
  private oneMonthInMs = 30 * 24 * 60 * 60 * 1000;

  public async getAlerts(): Promise<Result<AlertResponse, string>> {
    const { data: alert, error: alertError } = await supabaseServer.client
      .from("alert")
      .select("*")
      .eq("org_id", this.organizationId)
      .not("soft_delete", "eq", true);

    const { data: alertHistory, error: alertHistoryError } =
      await supabaseServer.client
        .from("alert_history")
        .select("*")
        .eq("org_id", this.organizationId)
        .not("soft_delete", "eq", true);

    if (alertError || !alert) {
      return err(alertError?.message || "");
    }

    if (alertHistoryError || !alertHistory) {
      return err(alertHistoryError?.message || "");
    }

    return ok({ alerts: alert, history: alertHistory });
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
      INSERT INTO alert (name, metric, threshold, time_window, emails, slack_channels, org_id, minimum_request_count, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
    ];

    const result = await dbExecute<{ id: string }>(query, parameters);
    if (result.error || !result.data || result.data.length === 0) {
      return err(`Error creating alert: ${result.error}`);
    }
    return ok(result.data[0].id);
  }

  public async deleteAlert(alertId: string): Promise<Result<null, string>> {
    const deleteResult = await supabaseServer.client
      .from("alert")
      .update({ soft_delete: true })
      .eq("id", alertId)
      .eq("org_id", this.organizationId);
    if (deleteResult.error) {
      return err(`Error deleting alert: ${deleteResult.error}`);
    }
    return ok(null);
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

    if (alert.metric !== "response.status" && alert.metric !== "cost")
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
