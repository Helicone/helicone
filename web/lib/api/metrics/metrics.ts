import { SupabaseClient, User, UserResponse } from "@supabase/supabase-js";
import { Data } from "react-csv/components/CommonPropTypes";
import { Database } from "../../../supabase/database.types";
import { isError, Result, unwrap, unwrapAsync, unwrapList } from "../../result";
import { modelCost } from "./costCalc";
import { FilterNode } from "./filters";
import { getRequestCount } from "./getRequestCount";
import { getXRequestDate } from "./getXRequestDate";
import { getModelMetrics, ModelMetrics } from "./modelMetrics";
import { getAggregatedAvgMetrics } from "./timeMetrics";

export interface Metrics {
  average_requests_per_day: number;
  average_response_time: number;
  average_tokens_per_response: number;
  total_requests: number;
  first_request: Date;
  last_request: Date;
  total_cost: number;
  total_cached_requests: number;
  total_cached_savings: number;
}

export interface GetMetricsOptions {
  filter: FilterNode;
}

export interface AuthClient {
  client: SupabaseClient;
  user: User;
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
  const { client, user } = authClient;
  try {
    const results = await Promise.all([
      unwrapAsync(getModelMetrics(options.filter, user.id, false)),
      unwrapAsync(getModelMetrics(options.filter, user.id, true)),
      unwrapAsync(getXRequestDate(options.filter, user.id, true)),
      unwrapAsync(getXRequestDate(options.filter, user.id, false)),
      unwrapAsync(getRequestCount(options.filter, user.id, false)),
      unwrapAsync(getRequestCount(options.filter, user.id, true)),
      unwrapAsync(getAggregatedAvgMetrics(options.filter, user.id)),
    ]);
    return { data: results, error: null };
  } catch (error) {
    console.log("error", error);
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
    total_cached_savings: cachedModelMetrics.reduce(
      (acc, modelMetric) => acc + modelCost(modelMetric),
      0
    ),
    total_cached_requests: totalCachedRequests,
    total_requests: count,
    first_request: startDate,
    last_request: endDate,
    ...aggregatedAvgMetrics,
  };

  return { data: metrics, error: null };
}
