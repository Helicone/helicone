import { BaseManager } from "../BaseManager";
import { err, ok, Result } from "../../packages/common/result";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";

interface TimeSeriesDataPoint {
  timestamp: string; // ISO string
  amount: number; // in dollars
}

interface TimeSeriesData {
  deposits: TimeSeriesDataPoint[];
  spend: TimeSeriesDataPoint[];
}

type TimeGranularity = "minute" | "hour" | "day" | "week" | "month";

export class AdminWalletAnalyticsManager extends BaseManager {
  /**
   * Gets time-series data for deposits and spend, grouped by specified granularity
   */
  async getTimeSeriesData(
    startDate: Date,
    endDate: Date,
    tokenUsageProductId: string,
    granularity: TimeGranularity = "day"
  ): Promise<Result<TimeSeriesData, string>> {
    try {
      // Fetch deposits from PostgreSQL (Stripe payment_intents)
      const depositsResult = await this.getDepositsTimeSeries(
        startDate,
        endDate,
        tokenUsageProductId,
        granularity
      );
      if (depositsResult.error) {
        return err(depositsResult.error);
      }

      // Fetch spend from ClickHouse
      const spendResult = await this.getSpendTimeSeries(
        startDate,
        endDate,
        granularity
      );
      if (spendResult.error) {
        return err(spendResult.error);
      }

      return ok({
        deposits: depositsResult.data || [],
        spend: spendResult.data || [],
      });
    } catch (error) {
      console.error("Error fetching time-series data:", error);
      return err(`Failed to fetch time-series data: ${error}`);
    }
  }

  /**
   * Gets deposits time-series from Stripe payment_intents, grouped by granularity
   */
  private async getDepositsTimeSeries(
    startDate: Date,
    endDate: Date,
    tokenUsageProductId: string,
    granularity: TimeGranularity
  ): Promise<Result<TimeSeriesDataPoint[], string>> {
    try {
      // Convert dates to epoch seconds (bigint)
      const startEpoch = Math.floor(startDate.getTime() / 1000);
      const endEpoch = Math.floor(endDate.getTime() / 1000);

      const query = `
        SELECT
          DATE_TRUNC('${granularity}', TO_TIMESTAMP(created)) as period_timestamp,
          COALESCE(SUM(amount_received), 0) as total_amount
        FROM stripe.payment_intents
        WHERE
          status = 'succeeded'
          AND metadata->>'productId' = $3
          AND created >= $1
          AND created < $2
        GROUP BY period_timestamp
        ORDER BY period_timestamp ASC
      `;

      const result = await dbExecute<{
        period_timestamp: Date;
        total_amount: string;
      }>(query, [startEpoch, endEpoch, tokenUsageProductId]);

      if (result.error) {
        return err(`Failed to fetch deposits: ${result.error}`);
      }

      // Convert cents to dollars and format
      const deposits: TimeSeriesDataPoint[] = (result.data || []).map(
        (row) => ({
          timestamp: row.period_timestamp.toISOString(),
          amount: Number(row.total_amount) / 100, // Convert cents to dollars
        })
      );

      return ok(deposits);
    } catch (error) {
      console.error("Error fetching deposits time-series:", error);
      return err(`Error fetching deposits: ${error}`);
    }
  }

  /**
   * Gets spend time-series from ClickHouse, grouped by granularity
   */
  private async getSpendTimeSeries(
    startDate: Date,
    endDate: Date,
    granularity: TimeGranularity
  ): Promise<Result<TimeSeriesDataPoint[], string>> {
    try {
      // Map granularity to ClickHouse function
      const clickhouseFunctions: Record<TimeGranularity, string> = {
        minute: "toStartOfMinute",
        hour: "toStartOfHour",
        day: "toStartOfDay",
        week: "toStartOfWeek",
        month: "toStartOfMonth",
      };

      const timeFunction = clickhouseFunctions[granularity];

      const query = `
        SELECT
          ${timeFunction}(request_created_at) as period_timestamp,
          SUM(cost) / ${COST_PRECISION_MULTIPLIER} as total_cost
        FROM request_response_rmt
        WHERE
          request_created_at >= {val_0: DateTime64(3)}
          AND request_created_at < {val_1: DateTime64(3)}
          AND cost > 0
          AND is_passthrough_billing = true
        GROUP BY period_timestamp
        ORDER BY period_timestamp ASC
      `;

      const result = await clickhouseDb.dbQuery<{
        period_timestamp: string;
        total_cost: number;
      }>(query, [startDate, endDate]);

      if (result.error) {
        return err(`Failed to fetch spend: ${result.error}`);
      }

      // Format the data
      const spend: TimeSeriesDataPoint[] = (result.data || []).map((row) => ({
        timestamp: new Date(row.period_timestamp).toISOString(),
        amount: Number(row.total_cost),
      }));

      return ok(spend);
    } catch (error) {
      console.error("Error fetching spend time-series:", error);
      return err(`Error fetching spend: ${error}`);
    }
  }
}
