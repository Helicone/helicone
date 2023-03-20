import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Metrics } from "../../../lib/api/metrics/metrics";
import { Result } from "../../../lib/result";
import { MetricsDB } from "../../../schema/metrics";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import { Loading } from "./dashboardPage";

interface MetricsPanelProps {
  filters: FilterNode;
  metrics: Loading<Result<Metrics, string>>;
}

export function MetricsPanel(props: MetricsPanelProps) {
  const { filters, metrics: metricsData } = props;

  const loading = metricsData === "loading";
  const data =
    metricsData === "loading" || metricsData.error !== null
      ? null
      : metricsData.data;

  const numberOfDaysActive = !data?.first_request
    ? null
    : Math.floor(
        (new Date().getTime() - (data.first_request!.getTime() ?? 0)) /
          (86400 * 1000) +
          1
      );

  const metrics = [
    {
      value:
        numberOfDaysActive && data?.total_requests
          ? (data?.total_requests / numberOfDaysActive).toFixed(2)
          : "n/a",
      label: "Avg Requests / day",
    },
    {
      value: data?.average_response_time?.toFixed(2) ?? "n/a",
      label: "Avg Response Time (s)",
    },
    {
      value: data?.average_tokens_per_response?.toFixed(2) ?? "n/a",
      label: "Avg Token / Response",
    },
    {
      value: data?.total_cost?.toFixed(2) ?? "n/a",
      label: "Total cost (USD)",
    },
    {
      value: +(data?.total_requests ?? 0) + +(data?.total_cached_requests ?? 0),
      label: "Total requests",
    },
    {
      value: data?.total_cached_requests ?? "n/a",
      label: "Cached Requests",
    },
    {
      value: data?.total_cached_savings?.toFixed(2) ?? "n/a",
      label: "Cache Savings (USD)",
    },
  ];

  return (
    <div>
      <dl className="mx-auto w-full grid grid-cols-2 sm:grid-cols-4 text-gray-900 gap-y-4">
        {metrics.map((row) => (
          <div
            key={row.label}
            className="flex flex-col pl-4 border-l border-gray-200"
          >
            <dd className="order-first text-sm sm:text-md font-bold tracking-tight">
              {loading ? (
                <div className="animate-pulse h-5 w-24 bg-gray-300 rounded-md" />
              ) : (
                row.value
              )}
            </dd>
            <dt className="text-xs sm:text-sm leading-6 text-gray-700">
              {row.label}
            </dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
