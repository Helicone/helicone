import { err, ok } from "../util/results";
import { clickhousePriceCalc } from "@helicone-package/cost";
export class AlertStore {
    supabaseClient;
    clickhouseClient;
    constructor(supabaseClient, clickhouseClient) {
        this.supabaseClient = supabaseClient;
        this.clickhouseClient = clickhouseClient;
    }
    async getAlerts() {
        const { data: alerts, error: alertsErr } = await this.supabaseClient
            .from("alert")
            .select("*, organization (integrations (id, integration_name, settings, active))")
            .eq("soft_delete", false);
        if (alertsErr) {
            return err(`Failed to retrieve all alerts: ${alertsErr}`);
        }
        return ok(alerts);
    }
    async updateAlertStatuses(status, alertIds) {
        const { error: alertUpdateErr } = await this.supabaseClient
            .from("alert")
            .update({
            status: status,
            updated_at: new Date().toISOString(),
        })
            .in("id", alertIds);
        if (alertUpdateErr) {
            return err(`Error updating triggered alerts: ${JSON.stringify(alertUpdateErr)}`);
        }
        return ok(null);
    }
    async updateAlertHistoryStatuses(status, alertIds, alertEndTime) {
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
            return err(`Error updating alert history: ${JSON.stringify(alertHistoryUpdateErr)}`);
        }
        return ok(null);
    }
    async insertAlertHistory(alertHistories) {
        const { error: alertHistoryInsErr } = await this.supabaseClient
            .from("alert_history")
            .insert(alertHistories);
        if (alertHistoryInsErr) {
            return err(`Error inserting alert history: ${JSON.stringify(alertHistoryInsErr)}`);
        }
        return ok(null);
    }
    async getCost(organizationId, timeWindowMs) {
        const query = `SELECT 
    ${clickhousePriceCalc("request_response_rmt")} as totalCount,
    COUNT() AS requestCount
    FROM request_response_rmt
    WHERE
    organization_id = {val_0: UUID} AND
    request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;
        const { data: cost, error: alertStateErr } = await this.clickhouseClient.dbQuery(query, [
            organizationId,
            timeWindowMs,
        ]);
        if (alertStateErr || !cost || cost.length === 0) {
            return err(`Failed to check alert state from clickhouse: ${alertStateErr}`);
        }
        return ok(cost[0]);
    }
    async getErrorRate(organizationId, timeWindowMs) {
        const query = `SELECT
    COUNT() AS totalCount,
    COUNTIf(status BETWEEN 400 AND 599) AS errorCount,
    COUNT() AS requestCount
  FROM request_response_rmt
  WHERE 
    organization_id = {val_0: UUID} AND
    request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND
  `;
        const { data: alertState, error: alertStateErr } = await this.clickhouseClient.dbQuery(query, [
            organizationId,
            timeWindowMs,
        ]);
        if (alertStateErr || !alertState || alertState.length === 0) {
            return err(`Failed to check alert state from clickhouse: ${alertStateErr}`);
        }
        return ok(alertState[0]);
    }
}
