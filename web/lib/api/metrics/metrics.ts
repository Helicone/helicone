import { SupabaseClient } from "@supabase/supabase-js";
import { FilterNode } from "../../shared/filters/filterDefs";
import { Result, unwrapAsync } from "../../shared/result";
import { modelCost } from "./costCalc";

import { getRequestCount } from "./getRequestCount";
import { getXRequestDate } from "./getXRequestDate";
import { getModelMetrics } from "./modelMetrics";
import { getAggregatedAvgMetrics } from "./timeMetrics";

export interface Metrics {
  average_requests_per_day: number;
  average_response_time: number;
  average_tokens_per_response: number;
  total_requests: number;
  first_request: Date;
  last_request: Date;
  total_cost: number;
  total_tokens: number;
}

export interface GetMetricsOptions {
  filter: FilterNode;
}

export interface AuthClient {
  client: SupabaseClient;
  orgId: string;
}

function calculateAverageRequestsPerDay(
  totalRequests: number,
  startDate: Date,
  endDate: Date
): number {
  const days =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  return totalRequests / days;
}

async function getData(authClient: AuthClient, options: GetMetricsOptions) {
  const { client, orgId } = authClient;
  try {
    const results = await Promise.all([
      unwrapAsync(getModelMetrics(options.filter, orgId, false)),
      unwrapAsync(getModelMetrics(options.filter, orgId, true)),
      unwrapAsync(getXRequestDate(options.filter, orgId, true)),
      unwrapAsync(getXRequestDate(options.filter, orgId, false)),
      unwrapAsync(getRequestCount(options.filter, orgId, false)),
      unwrapAsync(getRequestCount(options.filter, orgId, true)),
      unwrapAsync(getAggregatedAvgMetrics(options.filter, orgId)),
    ]);
    return { data: results, error: null };
  } catch (error) {
    console.error("error", error);
    return { data: null, error: JSON.stringify(error) };
  }
}

export async function getMetrics(
  authClient: AuthClient,
  options: GetMetricsOptions
): Promise<Result<Metrics, string>> {
  const { data, error } = await getData(authClient, options);
  if (error !== null) {
    return { data: null, error };
  }
  // Get raw data
  const [
    modelMetrics,
    cachedModelMetrics,
    startDate,
    endDate,
    count,
    totalCachedRequests,
    aggregatedAvgMetrics,
  ] = data;

  // calculate and format metrics
  const metrics: Metrics = {
    average_requests_per_day: calculateAverageRequestsPerDay(
      count,
      startDate,
      endDate
    ),
    total_cost: modelMetrics.reduce(
      (acc, modelMetric) => acc + modelCost(modelMetric),
      0
    ),
    total_tokens: modelMetrics.reduce(
      (acc, modelMetric) => acc + +modelMetric.sum_tokens,
      0
    ),
    total_requests: +count,
    first_request: startDate,
    last_request: endDate,
    ...aggregatedAvgMetrics,
  };

  return { data: metrics, error: null };
}
