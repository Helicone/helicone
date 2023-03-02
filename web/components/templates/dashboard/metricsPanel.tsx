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
  const { setNotification } = useNotification();
  if (metricsData !== "loading" && metricsData.error !== null) {
    // setNotification(metricsData.error, "error"); Do nothing, we need to support an empty set
  }

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
          ? (data?.total_requests / numberOfDaysActive).toFixed(3)
          : "n/a",
      label: "Avg Requests / day",
    },
    {
      value: data?.average_response_time?.toFixed(3) ?? "n/a",
      label: "Avg Response Time (s)",
    },
    {
      value: data?.average_tokens_per_response?.toFixed(3) ?? "n/a",
      label: "Avg Token / Response",
    },
    {
      value: data?.total_cost?.toFixed(3) ?? "n/a",
      label: "Total cost (USD)",
    },
    {
      value: data?.total_requests ?? "n/a",
      label: "Total requests",
    },
    {
      value: data?.total_cached_savings?.toFixed(3) ?? "n/a",
      label: "Cache Savings (USD)",
    },
    {
      value: data?.total_cached_requests ?? "n/a",
      label: "Cached Requests",
    },
  ];

  return (
    <div>
      <dl className="grid grid-cols-1 max-w-7xl gap-0.5 overflow-hidden rounded-lg text-center sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((row) => (
          <div
            key={row.label as string}
            className="flex flex-col bg-white p-2 border border-gray-300 shadow-sm rounded-lg"
          >
            <dt className="text-sm font-semibold text-gray-600">{row.label}</dt>
            <dd
              className={clsx(
                loading ? "animate-pulse text-gray-400" : "",
                "order-first text-lg font-semibold tracking-tight text-gray-900"
              )}
            >
              {loading ? "Loading" : row.value}
            </dd>
          </div>
        ))}
      </dl>
      {/* <dl className="grid grid-cols-2 gap-2 sm:gap-5 sm:grid-cols-5">
        {metrics.map((row) => (
          <div
            key={row.label as string}
            className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow"
          >
            <dt className="truncate text-sm font-medium text-gray-500">
              {row.label}
            </dt>
            <dd
              className={clsx(
                "mt-1 text-lg font-semibold tracking-tight text-gray-900",
                loading ? "animate-pulse text-gray-400" : ""
              )}
            >
              {loading ? "Loading" : row.value}
            </dd>
          </div>
        ))}
      </dl> */}
    </div>
  );
}
