import { ClickhouseClientWrapper } from "./ClickhouseWrapper";
import pgPromise from "pg-promise";
import { Result, err, ok } from "../util/results";
import { Database } from "../../../supabase/database.types";
import { clickhousePriceCalc } from "../../packages/cost";

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
    private sql: pgPromise.IDatabase<any>,
    private clickhouseClient: ClickhouseClientWrapper
  ) {}

  public async getAlerts(): Promise<Result<Alert[], string>> {
    try {
      const alerts = await this.sql.query(
        `SELECT 
          a.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', i.id,
                'integration_name', i.integration_name,
                'settings', i.settings,
                'active', i.active
              )
            ) FILTER (WHERE i.id IS NOT NULL),
            '[]'::json
          ) as integrations
        FROM alert a
        LEFT JOIN LATERAL (
          SELECT i.* 
          FROM integrations i 
          WHERE i.organization_id = a.organization
        ) i ON true
        WHERE a.soft_delete = false
        GROUP BY a.id, a.name, a.emails, a.webhooks, a.texts, a.time_window, 
                 a.threshold, a.status, a.soft_delete, a.updated_at, a.created_at,
                 a.organization, a.minimum_count, a.alert_type, a.time_block_duration`
      );

      // Transform to match the expected structure
      const transformedAlerts = alerts.map((alert: any) => ({
        ...alert,
        organization: {
          integrations: alert.integrations
        }
      }));

      return ok(transformedAlerts as Alert[]);
    } catch (error) {
      return err(`Failed to retrieve all alerts: ${error}`);
    }
  }

  public async updateAlertStatuses(
    status: AlertStatus,
    alertIds: string[]
  ): Promise<Result<null, string>> {
    try {
      await this.sql.none(
        `UPDATE alert
         SET 
           status = $1,
           updated_at = $2
         WHERE id = ANY($3)`,
        [status, new Date().toISOString(), alertIds]
      );

      return ok(null);
    } catch (error) {
      return err(
        `Error updating triggered alerts: ${JSON.stringify(error)}`
      );
    }
  }

  public async updateAlertHistoryStatuses(
    status: AlertStatus,
    alertIds: string[],
    alertEndTime?: string
  ): Promise<Result<null, string>> {
    try {
      await this.sql.none(
        `UPDATE alert_history
         SET 
           status = $1,
           alert_end_time = $2,
           updated_at = $3
         WHERE alert_id = ANY($4)
           AND status = 'triggered'`,
        [status, alertEndTime || null, new Date().toISOString(), alertIds]
      );

      return ok(null);
    } catch (error) {
      return err(
        `Error updating alert history: ${JSON.stringify(error)}`
      );
    }
  }

  public async insertAlertHistory(
    alertHistories: Database["public"]["Tables"]["alert_history"]["Insert"][]
  ): Promise<Result<null, string>> {
    try {
      if (alertHistories.length === 0) {
        return ok(null);
      }

      // Build dynamic insert with all the fields
      const fields = Object.keys(alertHistories[0]);
      const values = alertHistories.map(history => 
        fields.map(field => (history as any)[field])
      );

      // Build dynamic insert with all the fields
      const columns = fields.join(', ');
      const valuePlaceholders = alertHistories.map((_, i) => 
        `(${fields.map((_, j) => `$${i * fields.length + j + 1}`).join(', ')})`
      ).join(', ');
      
      await this.sql.none(
        `INSERT INTO alert_history (${columns}) VALUES ${valuePlaceholders}`,
        values.flat()
      );

      return ok(null);
    } catch (error) {
      return err(
        `Error inserting alert history: ${JSON.stringify(error)}`
      );
    }
  }

  public async getCost(
    organizationId: string,
    timeWindowMs: number
  ): Promise<Result<AlertState, string>> {
    const query = `SELECT 
    ${clickhousePriceCalc("request_response_rmt")} as totalCount,
    COUNT() AS requestCount
    FROM request_response_rmt
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
  FROM request_response_rmt
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
