import { ClickhouseClientWrapper } from "./ClickhouseWrapper";
import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database } from "../../../supabase/database.types";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { FilterExpression } from "@helicone-package/filters/types";

type AlertStatus = "triggered" | "resolved";
export type Alert = Database["public"]["Tables"]["alert"]["Row"] & {
  organization: {
    integrations: Database["public"]["Tables"]["integrations"]["Row"][];
  };
};

export type GroupedAlertResult = {
  groupKey: string; // The column being grouped by (user_id, model, provider, or property key)
  groupValue: string | null; // The actual value from that group
  aggregatedValue: number; // The calculated metric value (cost, latency, etc.)
  errorCount?: number; // For status metric - number of errors in this group
  totalCount?: number; // For status metric - total requests in this group (to calculate %)
  requestCount: number; // Total requests for minimum_request_count check
};

export type AlertState = {
  totalCount: number;
  errorCount?: number;
  requestCount: number;
  groupedResults?: GroupedAlertResult[];
};

const METRIC_CONFIGS: Record<string, string> = {
  cost: `cost / ${COST_PRECISION_MULTIPLIER}`,
  latency: "latency",
  prompt_tokens: "prompt_tokens",
  completion_tokens: "completion_tokens",
  prompt_cache_read_tokens: "prompt_cache_read_tokens",
  prompt_cache_write_tokens: "prompt_cache_write_tokens",
  total_tokens: "(prompt_tokens + completion_tokens + prompt_cache_read_tokens + prompt_cache_write_tokens)",
  count: "1", // count(*) equivalent
};

export class AlertStore {
  private static readonly STANDARD_GROUPING_MAP: Record<string, string> = {
    user: "user_id",
    model: "model",
    provider: "provider",
  };

  constructor(
    private supabaseClient: SupabaseClient<Database>,
    private clickhouseClient: ClickhouseClientWrapper
  ) {}

  private buildGroupByColumn(alert: Alert): string {
    if (!alert.grouping) return "";

    if (alert.grouping_is_property) {
      return `properties['${alert.grouping}']`;
    }

    return (
      AlertStore.STANDARD_GROUPING_MAP[alert.grouping] || alert.grouping
    );
  }

  private async applyAlertFilter(
    query: string,
    alert: Alert,
    params: any[]
  ): Promise<{ query: string; params: any[] }> {
    if (!alert.filter) {
      return { query, params };
    }

    const filterNode = toFilterNode(
      alert.filter as unknown as FilterExpression
    );
    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: alert.org_id,
      filter: filterNode,
      argsAcc: params,
    });

    return {
      query: query + ` AND (${builtFilter.filter})`,
      params: builtFilter.argsAcc,
    };
  }

  private buildBaseQuery(
    selectClause: string,
    hasGrouping: boolean,
    groupByColumn?: string
  ): string {
    const groupSelect =
      hasGrouping && groupByColumn
        ? `${groupByColumn} as groupValue,\n        `
        : "";

    return `SELECT
        ${groupSelect}${selectClause}
      FROM request_response_rmt
      WHERE
        organization_id = {val_0: UUID} AND
        request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;
  }

  private addGroupByAndHaving(
    query: string,
    alert: Alert,
    thresholdColumn: string
  ): string {
    if (!alert.grouping) return query;

    query += ` GROUP BY groupValue`;
    query += ` HAVING ${thresholdColumn} >= ${alert.threshold}`;

    if (alert.minimum_request_count) {
      query += ` AND requestCount >= ${alert.minimum_request_count}`;
    }

    return query;
  }

  private formatGroupedResults(
    results: any[],
    alert: Alert,
    mapRow: (row: any) => Omit<GroupedAlertResult, "groupKey" | "groupValue">
  ): GroupedAlertResult[] {
    return results
      .filter((row) => row.groupValue !== "" && row.groupValue !== null)
      .map((row) => ({
        groupKey: alert.grouping!,
        groupValue: row.groupValue,
        ...mapRow(row),
      }));
  }

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

  public async getAggregatedMetric(
    alert: Alert
  ): Promise<Result<AlertState, string>> {
    const metricExpression = METRIC_CONFIGS[alert.metric];
    if (!metricExpression) {
      return err(`Unsupported metric: ${alert.metric}`);
    }

    const aggregation = alert.aggregation || "sum";
    const hasGrouping = alert.grouping !== null;

    // Build aggregation function
    const aggFuncMap: Record<string, string> = {
      sum: "sum",
      avg: "avg",
      min: "min",
      max: "max",
      percentile: `quantile(${(alert.percentile || 50) / 100})`,
    };
    const aggFunc = aggFuncMap[aggregation] || "sum";
    const fullMetricExpression = `${aggFunc}(${metricExpression})`;

    // Build query using helpers
    const groupByColumn = this.buildGroupByColumn(alert);
    const selectClause = hasGrouping
      ? `${fullMetricExpression} as aggregatedValue,
        COUNT() as requestCount`
      : `${fullMetricExpression} as totalCount,
        COUNT() AS requestCount`;

    let query = this.buildBaseQuery(selectClause, hasGrouping, groupByColumn);
    let params: any[] = [alert.org_id, alert.time_window];

    // Apply filter
    const filtered = await this.applyAlertFilter(query, alert, params);
    query = filtered.query;
    params = filtered.params;

    // Add GROUP BY and HAVING
    query = this.addGroupByAndHaving(query, alert, "aggregatedValue");

    // Execute query
    const { data: results, error: alertStateErr } =
      await this.clickhouseClient.dbQuery<any>(query, params);

    if (alertStateErr) {
      return err(
        `Failed to check alert state from clickhouse: ${alertStateErr}`
      );
    }

    // Handle empty results
    if (!results || results.length === 0) {
      return ok({
        totalCount: 0,
        requestCount: 0,
        ...(hasGrouping && { groupedResults: [] }),
      });
    }

    // Format and return results
    if (hasGrouping) {
      const groupedResults = this.formatGroupedResults(results, alert, (row) => ({
        aggregatedValue: row.aggregatedValue,
        requestCount: row.requestCount,
      }));

      return ok({
        totalCount: groupedResults.length,
        requestCount: groupedResults.reduce((sum, r) => sum + r.requestCount, 0),
        groupedResults,
      });
    } else {
      return ok(results[0]);
    }
  }

  public async getErrorRate(
    alert: Alert
  ): Promise<Result<AlertState, string>> {
    const hasGrouping = alert.grouping !== null;

    // Build query using helpers
    const groupByColumn = this.buildGroupByColumn(alert);
    const selectClause = hasGrouping
      ? `COUNT() as totalCount,
        COUNTIf(status BETWEEN 400 AND 599) as errorCount,
        (errorCount / totalCount) * 100 as errorRate,
        COUNT() as requestCount`
      : `COUNT() AS totalCount,
        COUNTIf(status BETWEEN 400 AND 599) AS errorCount,
        COUNT() AS requestCount`;

    let query = this.buildBaseQuery(selectClause, hasGrouping, groupByColumn);
    let params: any[] = [alert.org_id, alert.time_window];

    // Apply filter
    const filtered = await this.applyAlertFilter(query, alert, params);
    query = filtered.query;
    params = filtered.params;

    // Add GROUP BY and HAVING
    query = this.addGroupByAndHaving(query, alert, "errorRate");

    // Execute query
    const { data: results, error: alertStateErr } =
      await this.clickhouseClient.dbQuery<any>(query, params);

    if (alertStateErr) {
      return err(
        `Failed to check alert state from clickhouse: ${alertStateErr}`
      );
    }

    // Handle empty results
    if (!results || results.length === 0) {
      return ok({
        totalCount: 0,
        errorCount: 0,
        requestCount: 0,
        ...(hasGrouping && { groupedResults: [] }),
      });
    }

    // Format and return results
    if (hasGrouping) {
      const groupedResults = this.formatGroupedResults(results, alert, (row) => ({
        aggregatedValue: row.errorRate,
        errorCount: row.errorCount,
        totalCount: row.totalCount,
        requestCount: row.requestCount,
      }));

      return ok({
        totalCount: groupedResults.reduce((sum, r) => sum + r.totalCount!, 0),
        errorCount: groupedResults.reduce((sum, r) => sum + r.errorCount!, 0),
        requestCount: groupedResults.reduce((sum, r) => sum + r.requestCount, 0),
        groupedResults,
      });
    } else {
      return ok(results[0]);
    }
  }
}
