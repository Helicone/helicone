import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { FilterLeaf, FilterNode } from "../../../lib/api/metrics/filters";
import { Metrics } from "../../../lib/api/metrics/metrics";
import { Result } from "../../../lib/result";
import { MetricsDB } from "../../../schema/metrics";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import { Loading } from "./dashboardPage";

interface MetricsPanelProps {
  filters: FilterNode;
<<<<<<< HEAD
}

export function MetricsPanel(props: MetricsPanelProps) {
  const { filters } = props;

  const [data, setData] = useState<Metrics | null>(null);
=======
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
>>>>>>> dfeaf401f21b61899c0f32472a3184e3a88a958c

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
  ];

  return (
    <div>
      <dl className="grid grid-cols-2 gap-2 sm:gap-5 sm:grid-cols-5">
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
      </dl>
    </div>
  );
}
