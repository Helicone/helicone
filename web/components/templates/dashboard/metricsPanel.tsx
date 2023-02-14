import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { MetricsDB } from "../../../schema/metrics";
import { Database } from "../../../supabase/database.types";

interface MetricsPanelProps {
  filters: FilterNode;
}

export function MetricsPanel() {
  const client = useSupabaseClient<Database>();
  interface Metrics {
    average_requests_per_day?: number;
    average_response_time?: number;
    average_tokens_per_request?: number;
    average_tokens_per_response?: number;
    average_cost_per_request?: number;
    total_requests?: number;
    first_request?: Date;
    last_request?: Date;
    total_cost?: number;
  }

  const [data, setData] = useState<Metrics>({});

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
      value: data.average_response_time?.toFixed(3) ?? "n/a",
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
  useEffect(() => {
    const fetch = async () => {
      client
        .from("request_rbac")
        .select("*", { count: "exact" })
        .then((res) => {
          setData((data) => ({ ...data, total_requests: res.count ?? 0 }));
        });
      client
        .from("request_rbac")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .single()
        .then(({ data: createdAt }) => {
          setData((data) => {
            if (createdAt && createdAt.created_at) {
              return {
                ...data,
                first_request: new Date(createdAt.created_at) ?? null,
              };
            }
            return data;
          });
        });

      client
        .from("model_metrics")
        .select("*")

        .then(({ data: metrics, error }) => {
          if (error) {
            console.error(error);
          }
          if (metrics) {
            const total_cost = metrics.reduce((acc, m) => {
              return acc + modelCost(m);
            }, 0);
            setData((data) => ({
              ...data,
              total_cost: total_cost,
            }));
          }
        });

      client
        .from("request_rbac")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
        .then(({ data: createdAt }) => {
          setData((data) => {
            if (createdAt && createdAt.created_at) {
              return {
                ...data,
                last_request: new Date(createdAt.created_at) ?? null,
              };
            }
            return data;
          });
        });

      client
        .from("metrics_rbac")
        .select("*")
        .limit(1)
        .single()
        .then(({ data: metrics }) => {
          if (metrics) {
            setData((data) => ({
              ...data,
              average_response_time: metrics.average_response_time ?? undefined,
              average_tokens_per_response:
                metrics.average_tokens_per_response ?? undefined,
            }));
          }
        });
    };

    fetch();
  }, [client]);

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
            <dd className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}