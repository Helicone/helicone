import { ClickhouseClientWrapper } from "./ClickhouseWrapper";
import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database } from "../../../supabase/database.types";
import { clickhousePriceCalc } from "../../packages/cost";

type AlertStatus = "triggered" | "resolved";
type Alert = Database["public"]["Tables"]["alert"]["Row"];
export type AlertState = {
  totalCount: number;
  errorCount?: number;
  requestCount: number;
};

export class AlertStore {
  constructor(
    private supabaseClient: SupabaseClient<Database>,
    private clickhouseClient: ClickhouseClientWrapper
  ) {}

  public async getAlerts(): Promise<Result<Alert[], string>> {
    const { data: alerts, error: alertsErr } = await this.supabaseClient
      .from("alert")
      .select("*")
      .eq("soft_delete", false);

    if (alertsErr) {
      return err(`Failed to retrieve all alerts: ${alertsErr}`);
    }

    return ok(alerts);
  }

  public async updateAlertStatuses(
    status: AlertStatus,
    alertIds: string[]
  ): Promise<Result<null, string>> {
    const { error: alertUpdateErr } = await this.supabaseClient
      .from("alert")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .in("id", alertIds);

    if (alertUpdateErr) {
      return err(
        `Error updating triggered alerts: ${JSON.stringify(alertUpdateErr)}`
      );
    }

    return ok(null);
  }

  public async updateAlertHistoryStatuses(
    status: AlertStatus,
    alertIds: string[],
    alertEndTime?: string
  ): Promise<Result<null, string>> {
    const { error: alertHistoryUpdateErr } = await this.supabaseClient
      .from("alert_history")
      .update({
        status: status,
        alert_end_time: alertEndTime,
        updated_at: new Date().toISOString(),
      })
      .in("alert_id", alertIds)
      .eq("status", "triggered");

    if (alertHistoryUpdateErr) {
      return err(
        `Error updating alert history: ${JSON.stringify(alertHistoryUpdateErr)}`
      );
    }

    return ok(null);
  }

  public async insertAlertHistory(
    alertHistories: Database["public"]["Tables"]["alert_history"]["Insert"][]
  ): Promise<Result<null, string>> {
    const { error: alertHistoryInsErr } = await this.supabaseClient
      .from("alert_history")
      .insert(alertHistories);

    if (alertHistoryInsErr) {
      return err(
        `Error inserting alert history: ${JSON.stringify(alertHistoryInsErr)}`
      );
    }

    return ok(null);
  }

  public async getCost(
    organizationId: string,
    timeWindowMs: number
  ): Promise<Result<AlertState, string>> {
    const query = `SELECT 
    ${clickhousePriceCalc("request_response_log")} as totalCount,
    COUNT() AS requestCount
    FROM request_response_log
    WHERE
    organization_id = {val_0: UUID} AND
    request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;

    const { data: cost, error: alertStateErr } =
      await this.clickhouseClient.dbQuery<AlertState>(query, [
        organizationId,
        timeWindowMs,
      ]);

    if (alertStateErr || !cost || cost.length === 0) {
      return err(
        `Failed to check alert state from clickhouse: ${alertStateErr}`
      );
    }

    return ok(cost[0]);
  }

  public async getErrorRate(
    organizationId: string,
    timeWindowMs: number
  ): Promise<Result<AlertState, string>> {
    const query = `SELECT
    COUNT() AS totalCount,
    COUNTIf(status BETWEEN 400 AND 599) AS errorCount,
    COUNT() AS requestCount
  FROM request_response_log
  WHERE 
    organization_id = {val_0: UUID} AND
    request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND
  `;
    const { data: alertState, error: alertStateErr } =
      await this.clickhouseClient.dbQuery<AlertState>(query, [
        organizationId,
        timeWindowMs,
      ]);

    if (alertStateErr || !alertState || alertState.length === 0) {
      return err(
        `Failed to check alert state from clickhouse: ${alertStateErr}`
      );
    }

    return ok(alertState[0]);
  }
}
