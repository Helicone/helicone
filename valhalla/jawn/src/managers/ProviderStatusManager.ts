import { Result, ok } from "../lib/shared/result";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { TimeFrame } from "../controllers/public/providerStatusController";

const PROVIDERS = [
  "OPENAI",
  "ANTHROPIC",
  "TOGETHER",
  "FIREWORKS",
  "GOOGLE",
  "OPENROUTER",
  "GROQ",
  "MISTRAL",
  "DEEPINFRA",
  "QSTASH",
] as const;

type Provider = (typeof PROVIDERS)[number];

interface TimeSeriesDataPoint {
  timestamp: Date;
  errorCount: number;
  requestCount: number;
  averageLatency: number;
  averageLatencyPerCompletionToken: number;
}

interface MetricsData {
  totalRequests: number;
  requestCountPrevious24h: number;
  requestVolumeChange: number;
  errorRate24h: number;
  errorRatePrevious24h: number;
  errorRateChange: number;
  averageLatency: number;
  averageLatencyPerToken: number;
  latencyChange: number;
  latencyPerTokenChange: number;
  recentRequestCount: number;
  recentErrorCount: number;
}

export interface ProviderMetrics {
  providerName: string;
  metrics: MetricsData & {
    timeSeriesData: TimeSeriesDataPoint[];
  };
}

interface TimeSeriesQueryResult {
  timestamp: string;
  provider: string;
  error_count: number;
  request_count: number;
  average_latency: number;
  average_latency_per_completion_token: number;
}

interface TotalMetricsQueryResult {
  provider?: string;
  request_count_24h: number;
  request_count_previous_24h: number;
  request_volume_change: number;
  error_rate_24h: number;
  error_rate_previous_24h: number;
  error_rate_change: number;
  average_latency: number;
  average_latency_per_token: number;
  latency_change: number;
  latency_per_token_change: number;
  recent_request_count: number;
  recent_error_count: number;
}

const TIME_FILTER_MAP = {
  "24h": {
    interval: "INTERVAL 1 DAY",
    groupingInterval: "INTERVAL 10 MINUTE",
  },
  "7d": {
    interval: "INTERVAL 7 DAY",
    groupingInterval: "INTERVAL 1 HOUR",
  },
  "30d": {
    interval: "INTERVAL 30 DAY",
    groupingInterval: "INTERVAL 6 HOUR",
  },
} as const;

export class ProviderStatusManager {
  private getTimeSeriesQuery(
    providerFilter: string,
    timeFilter: TimeFrame = "24h"
  ): string {
    const { interval, groupingInterval } = TIME_FILTER_MAP[timeFilter];

    return `
      SELECT 
        toStartOfInterval(request_created_at, ${groupingInterval}, 'UTC') as timestamp,
        countIf(status >= 500) as error_count,
        count(*) as request_count,
        avg(latency) as average_latency,
        avg(latency / nullif(completion_tokens, 0)) as average_latency_per_completion_token
      FROM request_response_rmt
      WHERE 
        request_created_at >= now() - ${interval}
        AND provider IN ${providerFilter}
      GROUP BY timestamp
      ORDER BY timestamp ASC
      WITH FILL FROM 
        toStartOfInterval(now() - ${interval}, ${groupingInterval}, 'UTC')
        TO toStartOfInterval(now(), ${groupingInterval}, 'UTC')
        STEP ${groupingInterval}
    `;
  }

  private getTotalMetricsQuery(providerFilter: string): string {
    return `
      WITH 
        previous_period AS (
          SELECT 
            provider,
            count(*) as previous_request_count,
            countIf(status >= 500) as previous_error_count,
            (previous_error_count / nullif(previous_request_count, 0)) * 100 as previous_error_rate,
            avg(latency) as average_latency,
            avg(if(completion_tokens > 0, latency / completion_tokens, null)) as average_latency_per_token
          FROM request_response_rmt
          WHERE 
            request_created_at >= now() - INTERVAL 2 DAY
            AND request_created_at < now() - INTERVAL 1 DAY
            AND provider IN ${providerFilter}
          GROUP BY provider
        ),
        current_period AS (
          SELECT 
            provider,
            count(*) as current_request_count,
            countIf(status >= 500) as current_error_count,
            (current_error_count / nullif(current_request_count, 0)) * 100 as current_error_rate,
            avg(latency) as average_latency,
            avg(if(completion_tokens > 0, latency / completion_tokens, null)) as average_latency_per_token
          FROM request_response_rmt
          WHERE 
            request_created_at >= now() - INTERVAL 1 DAY
            AND provider IN ${providerFilter}
          GROUP BY provider
        ),
        recent_errors AS (
          SELECT 
            provider,
            count(*) as recent_request_count,
            countIf(status >= 500) as recent_error_count
          FROM request_response_rmt
          WHERE 
            request_created_at >= now() - INTERVAL 10 MINUTE
            AND provider IN ${providerFilter}
          GROUP BY provider
        )
      SELECT 
        c.provider as provider,
        c.current_request_count as request_count_24h,
        p.previous_request_count as request_count_previous_24h,
        ((c.current_request_count - p.previous_request_count) / nullif(p.previous_request_count, 0)) * 100 as request_volume_change,
        c.current_error_rate as error_rate_24h,
        p.previous_error_rate as error_rate_previous_24h,
        (c.current_error_rate - p.previous_error_rate) as error_rate_change,
        c.average_latency as average_latency,
        c.average_latency_per_token as average_latency_per_token,
        ((c.average_latency - p.average_latency) / nullif(p.average_latency, 0)) * 100 as latency_change,
        ((c.average_latency_per_token - p.average_latency_per_token) / nullif(p.average_latency_per_token, 0)) * 100 as latency_per_token_change,
        r.recent_request_count as recent_request_count,
        r.recent_error_count as recent_error_count
      FROM current_period c
      LEFT JOIN previous_period p ON c.provider = p.provider
      LEFT JOIN recent_errors r ON c.provider = r.provider
    `;
  }

  private transformTimeSeriesData(
    data: TimeSeriesQueryResult[]
  ): TimeSeriesDataPoint[] {
    return data.map((d) => ({
      timestamp: new Date(d.timestamp),
      errorCount: d.error_count ?? 0,
      requestCount: d.request_count ?? 0,
      averageLatency: d.average_latency ?? 0,
      averageLatencyPerCompletionToken:
        d.average_latency_per_completion_token ?? 0,
    }));
  }

  private transformTotalMetrics(
    data?: TotalMetricsQueryResult,
    timeSeriesData: TimeSeriesDataPoint[] = []
  ): ProviderMetrics {
    return {
      providerName: data?.provider ?? "",
      metrics: {
        totalRequests: data?.request_count_24h ?? 0,
        requestCountPrevious24h: data?.request_count_previous_24h ?? 0,
        requestVolumeChange: data?.request_volume_change ?? 0,
        errorRate24h: data?.error_rate_24h ?? 0,
        errorRatePrevious24h: data?.error_rate_previous_24h ?? 0,
        errorRateChange: data?.error_rate_change ?? 0,
        averageLatency: data?.average_latency ?? 0,
        averageLatencyPerToken: data?.average_latency_per_token ?? 0,
        latencyChange: data?.latency_change ?? 0,
        latencyPerTokenChange: data?.latency_per_token_change ?? 0,
        recentRequestCount: data?.recent_request_count ?? 0,
        recentErrorCount: data?.recent_error_count ?? 0,
        timeSeriesData,
      },
    };
  }

  async getAllProviderStatus(): Promise<Result<ProviderMetrics[], string>> {
    const providerList = `(${PROVIDERS.map((p) => `'${p}'`).join(",")})`;

    const [timeSeriesResult, totalResult] = await Promise.all([
      clickhouseDb.dbQuery<TimeSeriesQueryResult>(
        this.getTimeSeriesQuery(providerList),
        []
      ),
      clickhouseDb.dbQuery<TotalMetricsQueryResult>(
        this.getTotalMetricsQuery(providerList),
        []
      ),
    ]);

    if (timeSeriesResult.error) return timeSeriesResult;
    if (totalResult.error) return totalResult;

    const timeSeriesByProvider = (timeSeriesResult.data ?? []).reduce(
      (acc, curr) => {
        const provider = curr.provider as Provider;
        if (!acc[provider]) {
          acc[provider] = [];
        }
        acc[provider].push(curr);
        return acc;
      },
      {} as Record<Provider, TimeSeriesQueryResult[]>
    );

    const metrics = PROVIDERS.map((provider) => {
      const providerData = totalResult.data?.find(
        (d) => d.provider === provider
      );

      if (!providerData) {
        return this.transformTotalMetrics(providerData);
      }

      const timeSeriesData = this.transformTimeSeriesData(
        timeSeriesByProvider[provider] ?? []
      );

      return this.transformTotalMetrics(providerData, timeSeriesData);
    });

    return ok(metrics);
  }

  async getProviderStatus(
    provider: string,
    timeFrame: TimeFrame
  ): Promise<Result<ProviderMetrics, string>> {
    const upperProvider = provider.toUpperCase();

    if (!PROVIDERS.includes(upperProvider as Provider)) {
      return ok(this.transformTotalMetrics());
    }

    const providerList = `'${upperProvider}'`;

    const [timeSeriesResult, totalResult] = await Promise.all([
      clickhouseDb.dbQuery<TimeSeriesQueryResult>(
        this.getTimeSeriesQuery(providerList, timeFrame),
        []
      ),
      clickhouseDb.dbQuery<TotalMetricsQueryResult>(
        this.getTotalMetricsQuery(providerList),
        []
      ),
    ]);

    if (timeSeriesResult.error) return timeSeriesResult;
    if (totalResult.error) return totalResult;

    if (!totalResult.data?.[0]) {
      return ok(this.transformTotalMetrics());
    }

    const timeSeriesData = this.transformTimeSeriesData(
      timeSeriesResult.data ?? []
    );
    return ok(this.transformTotalMetrics(totalResult.data[0], timeSeriesData));
  }
}
