import {
  Model,
  ModelsToCompare,
} from "../controllers/public/modelComparisonController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { err, ok } from "../lib/shared/result";
import { Result } from "../lib/shared/result";
import { providers } from "../packages/cost/providers/mappings";

// Query Result Types
interface ModelMetricsQueryResult {
  model: string;
  provider: string;
  average_latency_per_1000_tokens: number;
  median_latency_per_1000_tokens: number;
  min_latency_per_1000_tokens: number;
  max_latency_per_1000_tokens: number;
  p90_latency_per_1000_tokens: number;
  p95_latency_per_1000_tokens: number;
  p99_latency_per_1000_tokens: number;
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
  negative_percentage: number;
  positive_feedback_count: number;
  negative_feedback_count: number;
  total_feedback: number;
  unique_feedback_values: number[];
}

interface GeographicLatencyQueryResult {
  country_code: string;
  median_latency_per_1000_tokens: number;
}

interface GeographicTtftQueryResult {
  country_code: string;
  median_ttft: number;
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
    modelsToCompare: ModelsToCompare[]
  ): Promise<Result<Model[], string>> {
    // Map over all models to get their info in parallel
    const modelResults = await Promise.all(
      modelsToCompare.map((model) => {
        const formattedModelNames = `('${model.names.join("','")}')`;
        return this.getModelInfo(
          model.parent,
          formattedModelNames,
          model.provider
        );
      })
    );

    const errorResult = modelResults.find((result) => result.error);
    if (!modelResults || errorResult?.error)
      return err(errorResult?.error ?? "Unknown error");

    return ok(
      modelResults
        .map((result) => result.data)
        .filter((model): model is Model => model !== null)
    );
  }

  private async getModelInfo(
    model: string,
    formattedModelNames: string,
    provider: string
  ): Promise<Result<Model, string>> {
    const normalizedProvider = provider.toUpperCase();

    const [
      metricsResult,
      geoResult,
      timeSeriesResult,
      costResult,
      geoTtftResult,
    ] = await Promise.all([
      clickhouseDb.dbQuery<ModelMetricsQueryResult>(
        this.getModelMetricsQuery(formattedModelNames, normalizedProvider),
        []
      ),
      clickhouseDb.dbQuery<GeographicLatencyQueryResult>(
        this.getGeographicLatencyQuery(formattedModelNames, normalizedProvider),
        []
      ),
      clickhouseDb.dbQuery<TimeSeriesQueryResult>(
        this.getTimeSeriesQuery(formattedModelNames, normalizedProvider),
        []
      ),
      clickhouseDb.dbQuery<CostQueryResult>(
        this.getCostQuery(formattedModelNames, normalizedProvider),
        []
      ),
      clickhouseDb.dbQuery<GeographicTtftQueryResult>(
        this.getGeographicTtftQuery(formattedModelNames, normalizedProvider),
        []
      ),
    ]);

    if (metricsResult.error) return metricsResult;
    if (geoResult.error) return geoResult;
    if (timeSeriesResult.error) return timeSeriesResult;
    if (costResult.error) return costResult;
    if (geoTtftResult.error) return geoTtftResult;

    const metrics = metricsResult.data?.[0];
    if (!metrics) {
      return err("No data found for model");
    }

    const providerCosts = providers.find(
      (p) => p.provider.toUpperCase() === normalizedProvider
    );
    if (!providerCosts) {
      return err("Provider not found");
    }

    return ok({
      model,
      provider,
      costs: {
        prompt_token:
          providerCosts.costs?.find((c) => c.model.value === metrics.model)
            ?.cost?.prompt_token ?? 0,
        completion_token:
          providerCosts.costs?.find((c) => c.model.value === metrics.model)
            ?.cost?.completion_token ?? 0,
      },
      latency: {
        average: metrics.average_latency_per_1000_tokens,
        median: metrics.median_latency_per_1000_tokens,
        min: metrics.min_latency_per_1000_tokens,
        max: metrics.max_latency_per_1000_tokens,
        p90: metrics.p90_latency_per_1000_tokens,
        p95: metrics.p95_latency_per_1000_tokens,
        p99: metrics.p99_latency_per_1000_tokens,
        medianPer1000Tokens: metrics.median_latency_per_1000_tokens,
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
      feedback: {
        positivePercentage: metrics.positive_percentage ?? 0,
        negativePercentage: metrics.negative_percentage ?? 0,
      },
      geographicLatency: (geoResult.data ?? []).map((geo) => ({
        countryCode: geo.country_code,
        median: geo.median_latency_per_1000_tokens,
      })),
      geographicTtft: (geoTtftResult.data ?? []).map((geo) => ({
        countryCode: geo.country_code,
        median: geo.median_ttft,
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

  private getModelMetricsQuery(
    formattedModelNames: string,
    provider: string
  ): string {
    return `
      SELECT
        model,
        provider,
        
        -- Latency stats
        avg(if(latency > 0 AND completion_tokens > 0, latency / completion_tokens * 1000, null)) as average_latency_per_1000_tokens,
        median(if(latency > 0 AND completion_tokens > 0, latency / completion_tokens * 1000, null)) as median_latency_per_1000_tokens,
        min(if(latency > 0 AND completion_tokens > 0, latency / completion_tokens * 1000, null)) as min_latency_per_1000_tokens,
        max(if(latency > 0 AND completion_tokens > 0, latency / completion_tokens * 1000, null)) as max_latency_per_1000_tokens,
        quantile(0.90)(if(latency > 0 AND completion_tokens > 0, latency / completion_tokens * 1000, null)) as p90_latency_per_1000_tokens,
        quantile(0.95)(if(latency > 0 AND completion_tokens > 0, latency / completion_tokens * 1000, null)) as p95_latency_per_1000_tokens,
        quantile(0.99)(if(latency > 0 AND completion_tokens > 0, latency / completion_tokens * 1000, null)) as p99_latency_per_1000_tokens,
        countIf(latency > 0 AND completion_tokens > 0) as valid_latency_count,
        
        -- TTFT stats
        avg(if(time_to_first_token > 0, time_to_first_token, null)) as average_ttft,
        median(if(time_to_first_token > 0, time_to_first_token, null)) as median_ttft,
        min(if(time_to_first_token > 0, time_to_first_token, null)) as min_ttft,
        max(if(time_to_first_token > 0, time_to_first_token, null)) as max_ttft,
        quantile(0.90)(if(time_to_first_token > 0, time_to_first_token, null)) as p90_ttft,
        quantile(0.95)(if(time_to_first_token > 0, time_to_first_token, null)) as p95_ttft,
        quantile(0.99)(if(time_to_first_token > 0, time_to_first_token, null)) as p99_ttft,

        -- Request status
        count(*) as total_requests,
        countIf(status < 500) as successful_requests,
        countIf(status >= 500) as error_requests,
        (successful_requests / total_requests) as success_rate,
        (error_requests / total_requests) as error_rate,

        -- Feedback counts
        countIf(has(scores, 'helicone-score-feedback')) as total_feedback,
        coalesce(countIf(has(scores, 'helicone-score-feedback') AND scores['helicone-score-feedback'] = 1) / 
          nullIf(total_feedback, 0), 0) as positive_percentage,
        coalesce(countIf(has(scores, 'helicone-score-feedback') AND scores['helicone-score-feedback'] = 0) / 
          nullIf(total_feedback, 0), 0) as negative_percentage
      FROM request_response_rmt
      WHERE model IN ${formattedModelNames}
        AND upper(provider) = '${provider}'
        AND request_created_at >= now() - INTERVAL 30 DAY
      GROUP BY model, provider`;
  }

  private getGeographicLatencyQuery(
    formattedModelNames: string,
    provider: string
  ): string {
    return `
      SELECT
        country_code,
        avg(if(completion_tokens > 0, latency / completion_tokens * 1000, null)) as average_latency_per_1000_tokens,
        median(if(completion_tokens > 0, latency / completion_tokens * 1000, null)) as median_latency_per_1000_tokens,
        min(if(completion_tokens > 0, latency / completion_tokens * 1000, null)) as min_latency_per_1000_tokens,
        max(if(completion_tokens > 0, latency / completion_tokens * 1000, null)) as max_latency_per_1000_tokens,
        quantile(0.90)(if(completion_tokens > 0, latency / completion_tokens * 1000, null)) as p90_latency_per_1000_tokens,
        quantile(0.95)(if(completion_tokens > 0, latency / completion_tokens * 1000, null)) as p95_latency_per_1000_tokens,
        quantile(0.99)(if(completion_tokens > 0, latency / completion_tokens * 1000, null)) as p99_latency_per_1000_tokens,
        median(if(completion_tokens > 0, (latency / completion_tokens) * 1000, null)) as median_latency_per_1000_tokens
      FROM request_response_rmt
      WHERE model IN ${formattedModelNames}
        AND upper(provider) = '${provider}'
        AND request_created_at >= now() - INTERVAL 30 DAY
        AND country_code != ''
        AND latency > 0
      GROUP BY country_code`;
  }

  private getGeographicTtftQuery(
    formattedModelNames: string,
    provider: string
  ): string {
    return `
      SELECT
        country_code,
        median(time_to_first_token) as median_ttft
      FROM request_response_rmt
      WHERE model IN ${formattedModelNames}
        AND upper(provider) = '${provider}'
        AND request_created_at >= now() - INTERVAL 30 DAY
        AND country_code != ''
        AND time_to_first_token > 0
      GROUP BY country_code`;
  }

  private getTimeSeriesQuery(
    formattedModelNames: string,
    provider: string
  ): string {
    return `
      WITH daily_stats AS (
        SELECT
          toStartOfInterval(request_created_at, INTERVAL 1 DAY) as timestamp,
          count(*) as total_requests,
          median(if(latency > 0 AND completion_tokens > 0, latency / completion_tokens * 1000, null)) as latency,
          median(if(time_to_first_token > 0, time_to_first_token, null)) as ttft,
          countIf(status < 500) / count(*) as success_rate,
          countIf(status >= 500) / count(*) as error_rate
        FROM request_response_rmt
        WHERE model IN ${formattedModelNames}
          AND upper(provider) = '${provider}'
          AND request_created_at >= now() - INTERVAL 30 DAY
        GROUP BY timestamp
        HAVING total_requests >= 100
      )
      SELECT
        timestamp,
        latency,
        ttft,
        success_rate,
        error_rate
      FROM daily_stats
      ORDER BY timestamp ASC
      WITH FILL FROM
        toStartOfInterval(now() - INTERVAL 30 DAY, INTERVAL 1 DAY)
        TO toStartOfInterval(now(), INTERVAL 1 DAY)
        STEP INTERVAL 1 DAY`;
  }

  private getCostQuery(formattedModelNames: string, provider: string): string {
    return `
      SELECT
        avg(prompt_tokens) as avg_input_tokens,
        avg(completion_tokens) as avg_output_tokens
      FROM request_response_rmt
      WHERE model IN ${formattedModelNames}
        AND upper(provider) = '${provider}'
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
