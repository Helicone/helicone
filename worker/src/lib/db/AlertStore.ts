import { ClickhouseClientWrapper } from "./ClickhouseWrapper";
import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database } from "../../../supabase/database.types";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { timeFilterToFilterNode } from "@helicone-package/filters/helpers";

type AlertStatus = "triggered" | "resolved";
export type Alert = Database["public"]["Tables"]["alert"]["Row"] & {
  organization: {
    integrations: Database["public"]["Tables"]["integrations"]["Row"][];
  };
};

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
      .select(
        "*, organization (integrations (id, integration_name, settings, active))"
      )
      .eq("soft_delete", false);

    if (alertsErr) {
      return err(`Failed to retrieve all alerts: ${alertsErr}`);
    }

    return ok(alerts as Alert[]);
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
    timeWindowMs: number,
    alertFilter?: FilterNode
  ): Promise<Result<AlertState, string>> {
    const timeFilter = {
      start: new Date(Date.now() - timeWindowMs),
      end: new Date(),
    };

    const { filter: filterString, argsAcc } = await buildFilterWithAuthClickHouse({
      org_id: organizationId,
      filter: alertFilter ? {
        left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
        right: alertFilter,
        operator: "and",
      } : timeFilterToFilterNode(timeFilter, "request_response_rmt"),
      argsAcc: [],
    });

    const query = `SELECT 
    sum(cost) / ${COST_PRECISION_MULTIPLIER} as totalCount,
    COUNT() AS requestCount
    FROM request_response_rmt
    WHERE (${filterString})`;

    const { data: cost, error: alertStateErr } =
      await this.clickhouseClient.dbQuery<AlertState>(query, argsAcc);

    if (alertStateErr || !cost || cost.length === 0) {
      return err(
        `Failed to check alert state from clickhouse: ${alertStateErr}`
      );
    }

    return ok(cost[0]);
  }

  public async getErrorRate(
    organizationId: string,
    timeWindowMs: number,
    alertFilter?: FilterNode
  ): Promise<Result<AlertState, string>> {
    const timeFilter = {
      start: new Date(Date.now() - timeWindowMs),
      end: new Date(),
    };

    const { filter: filterString, argsAcc } = await buildFilterWithAuthClickHouse({
      org_id: organizationId,
      filter: alertFilter ? {
        left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
        right: alertFilter,
        operator: "and",
      } : timeFilterToFilterNode(timeFilter, "request_response_rmt"),
      argsAcc: [],
    });

    const query = `SELECT
    COUNT() AS totalCount,
    COUNTIf(status BETWEEN 400 AND 599) AS errorCount,
    COUNT() AS requestCount
  FROM request_response_rmt
  WHERE (${filterString})`;

    const { data: alertState, error: alertStateErr } =
      await this.clickhouseClient.dbQuery<AlertState>(query, argsAcc);

    if (alertStateErr || !alertState || alertState.length === 0) {
      return err(
        `Failed to check alert state from clickhouse: ${alertStateErr}`
      );
    }

    return ok(alertState[0]);
  }
}
