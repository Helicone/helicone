import { Result, ok } from "../lib/shared/result";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";

export type ProviderMetrics = {
  providerName: string;
  metrics: {
    totalRequests: number;
    requestCountPrevious24h: number;
    requestVolumeChange: number;
    errorRate24h: number;
    errorRatePrevious24h: number;
    errorRateChange: number;
    timeSeriesData: {
      timestamp: Date;
      errorRate: number;
      errorCount: number;
      requestCount: number;
    }[];
  };
};

// ... existing code ...

// Good: OpenAI, Anthropic, Together AI, Fireworks, Google, OpenRouter, Groq, Mistral, DeepInfra, QStash
// Bad: Azure, Local, Helicone, Amdbartek, Anyscale, Cloudflare, 2yfv, Lemonfox, Wisdominanutshell, Cohere, Firecrawl

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

export type ProviderMetrics2 = {
  providerName: string;
  metrics: {
    totalRequests: number;
    requestCountPrevious24h: number;
    requestVolumeChange: number;
    errorRate24h: number;
    errorRatePrevious24h: number;
    errorRateChange: number;
    timeSeriesData: {
      timestamp: Date;
      errorCount: number;
      requestCount: number;
      errorRate: number;
    }[];
  };
};

export class ProviderStatusManager {
  async getAllProviderStatus(): Promise<Result<ProviderMetrics[], string>> {
    const providerList = `(${PROVIDERS.map((p) => `'${p}'`).join(",")})`;
    const timeSeriesQuery = `
      SELECT 
        toStartOfInterval(request_created_at, INTERVAL 10 MINUTE, 'UTC') as timestamp,
        countIf(status >= 500) as error_count,
        count(*) as request_count,
        error_count,
        (error_count / request_count) * 100 as error_rate
      FROM request_response_rmt
      WHERE 
        request_created_at >= now() - INTERVAL 1 DAY
        AND provider IN ${providerList}
      GROUP BY timestamp
      ORDER BY timestamp ASC
      WITH FILL FROM 
        toStartOfInterval(now() - INTERVAL 1 DAY, INTERVAL 10 MINUTE, 'UTC')
        TO toStartOfInterval(now(), INTERVAL 10 MINUTE, 'UTC')
        STEP INTERVAL 10 MINUTE
    `;

    const totalQuery = `
      WITH previous_period AS (
        SELECT 
            provider,
            count(*) as previous_request_count,
            countIf(status >= 500) as previous_error_count,
            (previous_error_count / nullif(previous_request_count, 0)) * 100 as previous_error_rate
        FROM request_response_rmt
        WHERE 
            request_created_at >= now() - INTERVAL 2 DAY
            AND request_created_at < now() - INTERVAL 1 DAY
            AND provider IN ${providerList}
        GROUP BY provider
        ),
        current_period AS (
        SELECT 
            provider,
            count(*) as current_request_count,
            countIf(status >= 500) as current_error_count,
            (current_error_count / nullif(current_request_count, 0)) * 100 as current_error_rate
        FROM request_response_rmt
        WHERE 
            request_created_at >= now() - INTERVAL 1 DAY
            AND provider IN ${providerList}
        GROUP BY provider
        )
        SELECT 
        c.provider,
        c.current_request_count as request_count_24h,
        p.previous_request_count as request_count_previous_24h,
        ((c.current_request_count - p.previous_request_count) / nullif(p.previous_request_count, 0)) * 100 as request_volume_change,
        c.current_error_rate as error_rate_24h,
        p.previous_error_rate as error_rate_previous_24h,
        (c.current_error_rate - p.previous_error_rate) as error_rate_change
        FROM current_period c
        LEFT JOIN previous_period p ON c.provider = p.provider
    `;

    const [timeSeriesResult, totalResult] = await Promise.all([
      clickhouseDb.dbQuery<{
        provider: string;
        timestamp: string;
        error_count: number;
        request_count: number;
        error_rate: number;
      }>(timeSeriesQuery, []),
      clickhouseDb.dbQuery<{
        provider: string;
        request_count_24h: number;
        request_count_previous_24h: number;
        request_volume_change: number;
        error_rate_24h: number;
        error_rate_previous_24h: number;
        error_rate_change: number;
      }>(totalQuery, []),
    ]);

    if (timeSeriesResult.error) return timeSeriesResult;
    if (totalResult.error) return totalResult;

    // Create a map of provider metrics for easy lookup
    const providerMetrics = new Map(
      totalResult.data?.map((d) => [
        d.provider,
        {
          requestCount24h: d.request_count_24h,
          requestCountPrevious24h: d.request_count_previous_24h,
          requestVolumeChange: d.request_volume_change,
          errorRate24h: d.error_rate_24h,
          errorRatePrevious24h: d.error_rate_previous_24h,
          errorRateChange: d.error_rate_change,
        },
      ]) ?? []
    );

    // Group time series data by provider
    const timeSeriesByProvider =
      timeSeriesResult.data?.reduce((acc, curr) => {
        if (!acc[curr.provider]) {
          acc[curr.provider] = [];
        }
        acc[curr.provider].push({
          timestamp: new Date(curr.timestamp),
          errorCount: curr.error_count ?? 0,
          errorRate: curr.error_rate ?? 0,
          requestCount: curr.request_count ?? 0,
        });
        return acc;
      }, {} as Record<string, any>) ?? {};

    // Create metrics for all allowed providers
    const metrics = PROVIDERS.map((provider) => {
      const providerMetric = providerMetrics.get(provider) ?? {
        requestCount24h: 0,
        requestCountPrevious24h: 0,
        requestVolumeChange: 0,
        errorRate24h: 0,
        errorRatePrevious24h: 0,
        errorRateChange: 0,
      };

      return {
        providerName: provider,
        metrics: {
          totalRequests: providerMetric.requestCount24h,
          requestCountPrevious24h: providerMetric.requestCountPrevious24h,
          requestVolumeChange: providerMetric.requestVolumeChange,
          errorRate24h: providerMetric.errorRate24h,
          errorRatePrevious24h: providerMetric.errorRatePrevious24h,
          errorRateChange: providerMetric.errorRateChange,
          timeSeriesData: timeSeriesByProvider[provider] ?? [],
        },
      };
    });

    return ok(metrics);
  }

  async getProviderStatus(
    provider: string
  ): Promise<Result<ProviderMetrics, string>> {
    const upperProvider = provider.toUpperCase();

    if (!PROVIDERS.includes(upperProvider as (typeof PROVIDERS)[number])) {
      return ok({
        providerName: upperProvider,
        metrics: {
          totalRequests: 0,
          requestCountPrevious24h: 0,
          requestVolumeChange: 0,
          errorRate24h: 0,
          errorRatePrevious24h: 0,
          errorRateChange: 0,
          timeSeriesData: [],
        },
      });
    }

    const providerList = `'${upperProvider}'`;

    const timeSeriesQuery = `
      SELECT 
        toStartOfInterval(request_created_at, INTERVAL 10 MINUTE, 'UTC') as timestamp,
        countIf(status >= 500) as error_count,
        count(*) as request_count,
        error_count,
        (error_count / request_count) * 100 as error_rate
      FROM request_response_rmt
      WHERE 
        request_created_at >= now() - INTERVAL 1 DAY
        AND provider = ${providerList}
      GROUP BY timestamp
      ORDER BY timestamp ASC
      WITH FILL FROM 
        toStartOfInterval(now() - INTERVAL 1 DAY, INTERVAL 10 MINUTE, 'UTC')
        TO toStartOfInterval(now(), INTERVAL 10 MINUTE, 'UTC')
        STEP INTERVAL 10 MINUTE
    `;

    const totalQuery = `
      WITH previous_period AS (
        SELECT 
          count(*) as previous_request_count,
          countIf(status >= 500) as previous_error_count,
          (previous_error_count / nullif(previous_request_count, 0)) * 100 as previous_error_rate
        FROM request_response_rmt
        WHERE 
          request_created_at >= now() - INTERVAL 2 DAY
          AND request_created_at < now() - INTERVAL 1 DAY
          AND provider = ${providerList}
        ),
        current_period AS (
        SELECT 
          count(*) as current_request_count,
          countIf(status >= 500) as current_error_count,
          (current_error_count / nullif(current_request_count, 0)) * 100 as current_error_rate
        FROM request_response_rmt
        WHERE 
          request_created_at >= now() - INTERVAL 1 DAY
          AND provider = ${providerList}
        )
        SELECT 
          c.current_request_count as request_count_24h,
          p.previous_request_count as request_count_previous_24h,
          ((c.current_request_count - p.previous_request_count) / nullif(p.previous_request_count, 0)) * 100 as request_volume_change,
          c.current_error_rate as error_rate_24h,
          p.previous_error_rate as error_rate_previous_24h,
          (c.current_error_rate - p.previous_error_rate) as error_rate_change
        FROM current_period c
        LEFT JOIN previous_period p ON 1=1
    `;

    const [timeSeriesResult, totalResult] = await Promise.all([
      clickhouseDb.dbQuery<{
        timestamp: string;
        error_count: number;
        request_count: number;
        error_rate: number;
      }>(timeSeriesQuery, []),
      clickhouseDb.dbQuery<{
        request_count_24h: number;
        request_count_previous_24h: number;
        request_volume_change: number;
        error_rate_24h: number;
        error_rate_previous_24h: number;
        error_rate_change: number;
      }>(totalQuery, []),
    ]);

    if (timeSeriesResult.error) return timeSeriesResult;
    if (totalResult.error) return totalResult;

    // If no data exists
    if (!totalResult.data?.[0]) {
      return ok({
        providerName: upperProvider,
        metrics: {
          totalRequests: 0,
          requestCountPrevious24h: 0,
          requestVolumeChange: 0,
          errorRate24h: 0,
          errorRatePrevious24h: 0,
          errorRateChange: 0,
          timeSeriesData: [],
        },
      });
    }

    const data = totalResult.data[0];
    return ok({
      providerName: upperProvider,
      metrics: {
        totalRequests: data.request_count_24h,
        requestCountPrevious24h: data.request_count_previous_24h,
        requestVolumeChange: data.request_volume_change,
        errorRate24h: data.error_rate_24h,
        errorRatePrevious24h: data.error_rate_previous_24h,
        errorRateChange: data.error_rate_change,
        timeSeriesData:
          timeSeriesResult.data?.map((d) => ({
            timestamp: new Date(d.timestamp),
            errorRate: d.error_rate ?? 0,
            errorCount: d.error_count ?? 0,
            requestCount: d.request_count ?? 0,
          })) ?? [],
      },
    });
  }
}
