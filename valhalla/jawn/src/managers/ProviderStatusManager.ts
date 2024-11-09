import { Result, ok } from "../lib/shared/result";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";

export type ProviderErrorRate = {
  interval: string;
  errorRate: number;
  totalRequests: number;
};

export class ProviderStatusManager {
  async getProviderStatus(
    provider: string
  ): Promise<Result<ProviderErrorRate[], string>> {
    const query = `
      SELECT 
        formatDateTime(request_created_at, '%Y-%m-%d %H:%M:00') as interval,
        countIf(status >= 500) as error_count,
        count(*) as total_count,
        (error_count / total_count) * 100 as error_rate
      FROM request_response_rmt
      WHERE 
        request_created_at >= now() - INTERVAL 24 HOUR
        AND provider = ${provider.toUpperCase()}
      GROUP BY 
        toStartOfInterval(request_created_at, INTERVAL 10 minute) as interval_start,
        interval
      ORDER BY interval DESC
    `;

    const result = await clickhouseDb.dbQuery<{
      interval: string;
      error_count: number;
      total_count: number;
      error_rate: number;
    }>(query, []);

    if (result.error) {
      return result;
    }

    // If no data or no requests in the last 24 hours
    if (!result.data?.length || result.data.every((d) => d.total_count === 0)) {
      return ok([]);
    }

    return ok(
      result.data.map((d) => ({
        interval: d.interval,
        errorRate: d.error_rate,
        totalRequests: d.total_count,
      }))
    );
  }
}
