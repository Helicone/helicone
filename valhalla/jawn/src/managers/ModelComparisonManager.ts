import { Model } from "../controllers/public/modelComparisonController";
import { ModelComparison } from "../controllers/public/modelComparisonController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { dbExecute } from "../lib/shared/db/dbExecute";
import { err, ok } from "../lib/shared/result";

import { Result } from "../lib/shared/result";

// Query Result Types
interface ModelMetricsQueryResult {
  model: string;
  provider: string;
  average_latency: number;
  median_latency: number;
  min_latency: number;
  max_latency: number;
  p90_latency: number;
  p95_latency: number;
  p99_latency: number;
  avg_latency_per_token: number;
  average_ttft: number;
  median_ttft: number;
  min_ttft: number;
  max_ttft: number;
  p90_ttft: number;
  p95_ttft: number;
  p99_ttft: number;
  total_requests: number;
  success_rate: number;
  error_rate: number;
  positive_percentage: number;
}

interface GeographicLatencyQueryResult {
  country_code: string;
  average_latency: number;
  median_latency: number;
  min_latency: number;
  max_latency: number;
  p90_latency: number;
  p95_latency: number;
  p99_latency: number;
  avg_latency_per_token: number;
}

interface TimeSeriesQueryResult {
  timestamp: string;
  latency: number;
  ttft: number;
  success_rate: number;
  error_rate: number;
}

interface CostQueryResult {
  avg_input_tokens: number;
  avg_output_tokens: number;
}

export class ModelComparisonManager {
  constructor() {}

  public async getModelComparison(
    modelA: string,
    modelB: string
  ): Promise<Result<ModelComparison, string>> {
    console.log("Getting model comparison for:", modelA, modelB);
    const [modelAResult, modelBResult] = await Promise.all([
      this.getModelInfo(modelA),
      this.getModelInfo(modelB),
    ]);

    if (modelAResult.error) return modelAResult;
    if (modelBResult.error) return modelBResult;

    return ok({
      models: [modelAResult.data, modelBResult.data] as Model[],
    });
  }

  private async getModelInfo(model: string): Promise<Result<Model, string>> {
    const [metricsResult, geoResult, timeSeriesResult, costResult] =
      await Promise.all([
        clickhouseDb.dbQuery<ModelMetricsQueryResult>(
          this.getModelMetricsQuery(model),
          []
        ),
        clickhouseDb.dbQuery<GeographicLatencyQueryResult>(
          this.getGeographicLatencyQuery(model),
          []
        ),
        clickhouseDb.dbQuery<TimeSeriesQueryResult>(
          this.getTimeSeriesQuery(model),
          []
        ),
        clickhouseDb.dbQuery<CostQueryResult>(this.getCostQuery(model), []),
      ]);

    if (metricsResult.error) return metricsResult;
    if (geoResult.error) return geoResult;
    if (timeSeriesResult.error) return timeSeriesResult;
    if (costResult.error) return costResult;

    const metrics = metricsResult.data?.[0];
    if (!metrics) {
      return err("No data found for model");
    }

    return ok({
      model: metrics.model,
      provider: metrics.provider,
      latency: {
        average: metrics.average_latency,
        median: metrics.median_latency,
        min: metrics.min_latency,
        max: metrics.max_latency,
        p90: metrics.p90_latency,
        p95: metrics.p95_latency,
        p99: metrics.p99_latency,
        averagePerCompletionToken: metrics.avg_latency_per_token,
      },
      ttft: {
        average: metrics.average_ttft,
        median: metrics.median_ttft,
        min: metrics.min_ttft,
        max: metrics.max_ttft,
        p90: metrics.p90_ttft,
        p95: metrics.p95_ttft,
        p99: metrics.p99_ttft,
      },
      cost: {
        input: costResult.data?.[0]?.avg_input_tokens ?? 0,
        output: costResult.data?.[0]?.avg_output_tokens ?? 0,
      },
      feedback: {
        positivePercentage: metrics.positive_percentage ?? 0,
      },
      geographicLatency: (geoResult.data ?? []).map((geo) => ({
        countryCode: geo.country_code,
        latency: {
          average: geo.average_latency,
          median: geo.median_latency,
          min: geo.min_latency,
          max: geo.max_latency,
          p90: geo.p90_latency,
          p95: geo.p95_latency,
          p99: geo.p99_latency,
          averagePerCompletionToken: geo.avg_latency_per_token,
        },
      })),
      requestStatus: {
        successRate: metrics.success_rate,
        errorRate: metrics.error_rate,
      },
      timeSeriesData: {
        latency: (timeSeriesResult.data ?? []).map((ts) => ({
          timestamp: ts.timestamp,
          value: ts.latency,
        })),
        ttft: (timeSeriesResult.data ?? []).map((ts) => ({
          timestamp: ts.timestamp,
          value: ts.ttft,
        })),
        successRate: (timeSeriesResult.data ?? []).map((ts) => ({
          timestamp: ts.timestamp,
          value: ts.success_rate,
        })),
        errorRate: (timeSeriesResult.data ?? []).map((ts) => ({
          timestamp: ts.timestamp,
          value: ts.error_rate,
        })),
      },
    });
  }

  private getModelMetricsQuery(model: string): string {
    return `
      SELECT
        model,
        provider,
        -- Latency stats
        avg(latency) as average_latency,
        median(latency) as median_latency,
        min(latency) as min_latency,
        max(latency) as max_latency,
        quantile(0.90)(latency) as p90_latency,
        quantile(0.95)(latency) as p95_latency,
        quantile(0.99)(latency) as p99_latency,
        median(if(completion_tokens > 0, (latency / completion_tokens) * 1000, null)) as avg_latency_per_token,
        -- TTFT stats
        avg(time_to_first_token) as average_ttft,
        median(time_to_first_token) as median_ttft,
        min(time_to_first_token) as min_ttft,
        max(time_to_first_token) as max_ttft,
        quantile(0.90)(time_to_first_token) as p90_ttft,
        quantile(0.95)(time_to_first_token) as p95_ttft,
        quantile(0.99)(time_to_first_token) as p99_ttft,
        -- Request status
        count(*) as total_requests,
        countIf(status < 500) / count(*) as success_rate,
        countIf(status >= 500) / count(*) as error_rate,
        -- Feedback
        avg(assumeNotNull(scores['thumbs_up'] = 1)) as positive_percentage
      FROM request_response_rmt
      WHERE model = '${model}'
        AND request_created_at >= now() - INTERVAL 30 DAY
      GROUP BY model, provider`;
  }

  private getGeographicLatencyQuery(model: string): string {
    return `
      SELECT
        country_code,
        avg(latency) as average_latency,
        median(latency) as median_latency,
        min(latency) as min_latency,
        max(latency) as max_latency,
        quantile(0.90)(latency) as p90_latency,
        quantile(0.95)(latency) as p95_latency,
        quantile(0.99)(latency) as p99_latency,
        median(if(completion_tokens > 0, (latency / completion_tokens) * 1000, null)) as avg_latency_per_token
      FROM request_response_rmt
      WHERE model = '${model}'
        AND request_created_at >= now() - INTERVAL 30 DAY
        AND country_code != ''
      GROUP BY country_code`;
  }

  private getTimeSeriesQuery(model: string): string {
    return `
      SELECT
        toStartOfInterval(request_created_at, INTERVAL 5 MINUTE) as timestamp,
        avg(latency) as latency,
        avg(time_to_first_token) as ttft,
        countIf(status < 500) / count(*) as success_rate,
        countIf(status >= 500) / count(*) as error_rate
      FROM request_response_rmt
      WHERE model = '${model}'
        AND request_created_at >= now() - INTERVAL 30 DAY
      GROUP BY timestamp
      ORDER BY timestamp ASC
      WITH FILL FROM
        toStartOfInterval(now() - INTERVAL 30 DAY, INTERVAL 10 MINUTE)
        TO toStartOfInterval(now(), INTERVAL 10 MINUTE)
        STEP INTERVAL 10 MINUTE`;
  }

  private getCostQuery(model: string): string {
    return `
      SELECT
        avg(prompt_tokens) as avg_input_tokens,
        avg(completion_tokens) as avg_output_tokens
      FROM request_response_rmt
      WHERE model = '${model}'
        AND request_created_at >= now() - INTERVAL 30 DAY`;
  }
}

/*
example from another manager
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
        if(c.provider = 'https://api.hyperbolic.xyz', 'HYPERBOLIC', c.provider) as provider,
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
*/
