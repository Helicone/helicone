import { ClickhouseClientWrapper } from "./ClickhouseWrapper";
import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database } from "../../../supabase/database.types";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { FilterNode, AggregationNode } from "@helicone-package/filters/filterDefs";
import { buildFilterWithAuthClickHouse, buildFilterClickHouse } from "@helicone-package/filters/filters";
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

  // New unified method for handling aggregation-based alerts
  public async checkAggregationAlert(
    organizationId: string,
    timeWindowMs: number,
    alertCondition: FilterNode
  ): Promise<Result<{ triggered: boolean; value: number; requestCount: number }, string>> {
    // Check if this is an aggregation node
    if (typeof alertCondition !== 'object' || 
        alertCondition === null || 
        !('type' in alertCondition) || 
        alertCondition.type !== "aggregation") {
      return err("Not an aggregation alert");
    }

    const aggregation = alertCondition as AggregationNode;
    const timeFilter = {
      start: new Date(Date.now() - timeWindowMs),
      end: new Date(),
    };

    // Build WHERE clause from aggregation.where + time filter
    const whereFilter = aggregation.where ? {
      left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
      right: aggregation.where,
      operator: "and" as const,
    } : timeFilterToFilterNode(timeFilter, "request_response_rmt");

    const { filter: whereClause, argsAcc: whereArgs } = 
      await buildFilterWithAuthClickHouse({
        org_id: organizationId,
        filter: whereFilter,
        argsAcc: [],
      });

    // Build HAVING clause from aggregation itself
    const { filter: havingClause, argsAcc } = buildFilterClickHouse({
      filter: aggregation,
      argsAcc: whereArgs,
      having: true,
    });

    // Build the aggregation query
    const query = `
      SELECT 
        1 as triggered,
        ${this.buildAggregationColumn(aggregation)} as value,
        COUNT(*) as request_count
      FROM request_response_rmt
      WHERE ${whereClause}
      GROUP BY organization_id
      HAVING ${havingClause}
    `;

    const { data, error: queryError } = 
      await this.clickhouseClient.dbQuery<{
        triggered: number;
        value: number;
        request_count: number;
      }>(query, argsAcc);

    if (queryError) {
      return err(`Failed to check aggregation alert: ${queryError}`);
    }

    // If we got any rows back, the alert is triggered
    const triggered = !!(data && data.length > 0);
    const result = data && data[0];

    return ok({
      triggered,
      value: result?.value || 0,
      requestCount: result?.request_count || 0,
    });
  }

  // Helper to build the aggregation column SQL
  private buildAggregationColumn(aggregation: AggregationNode): string {
    // Extract field name from the FilterLeaf
    const leaf = aggregation.field;
    const table = Object.keys(leaf)[0];
    
    if (table === "request_response_rmt") {
      const rmt = leaf.request_response_rmt;
      if (!rmt) return "0";
      
      const field = Object.keys(rmt)[0];
      
      // Map field names to actual columns
      const fieldMapping: Record<string, string> = {
        latency: "latency",
        cost: `cost / ${COST_PRECISION_MULTIPLIER}`,
        completion_tokens: "completion_tokens",
        prompt_tokens: "prompt_tokens",
        status: "status",
        time_to_first_token: "time_to_first_token",
        threat: "CAST(threat AS Int64)",
      };

      // Handle properties and scores
      if (field === "properties" && rmt.properties) {
        const propKey = Object.keys(rmt.properties)[0];
        return `toFloat64OrNull(properties['${propKey}'])`;
      }
      if (field === "scores" && rmt.scores) {
        const scoreKey = Object.keys(rmt.scores)[0];
        return `scores['${scoreKey}']`;
      }

      const column = fieldMapping[field] || field;
      
      // Apply aggregation function
      switch (aggregation.function) {
        case "sum":
          return `SUM(${column})`;
        case "avg":
          return `AVG(${column})`;
        case "min":
          return `MIN(${column})`;
        case "max":
          return `MAX(${column})`;
        case "count":
          return `COUNT(${column})`;
        case "p50":
          return `quantile(0.50)(${column})`;
        case "p75":
          return `quantile(0.75)(${column})`;
        case "p90":
          return `quantile(0.90)(${column})`;
        case "p95":
          return `quantile(0.95)(${column})`;
        case "p99":
          return `quantile(0.99)(${column})`;
        default:
          return `AVG(${column})`;
      }
    }
    
    return "0";
  }
}
