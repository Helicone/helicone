import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { MetricsDB } from "../../../schema/metrics";
import { Database } from "../../../supabase/database.types";

const OPENAI_COSTS = {
  ada: 0.0004,
  babbage: 0.0005,
  curie: 0.002,
  davinci: 0.02,
};

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
      label: "Average requests per day",
    },
    {
      value: data.average_response_time?.toFixed(3) ?? "n/a",
      label: "Average response time",
    },
    {
      value: data?.average_tokens_per_response?.toFixed(3) ?? "n/a",
      label: "Average # of Token/response",
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
              const model = m.model;
              const tokens = m.sum_tokens;
              if (tokens === null) {
                console.error("Tokens is null");
                return 0;
              }
              if (model === null) {
                console.error("Model is null");
                return 0;
              }
              const cost = Object.entries(OPENAI_COSTS).find(([key]) =>
                model.includes(key)
              )?.[1];
              if (!cost) {
                console.error("No cost found for model", model);
                return 0;
              }
              return acc + (cost * tokens) / 1000;
            }, 0);
            setData((data) => ({
              ...data,
              total_cost: total_cost,
            }));

            console.log(metrics);
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
    <div className="grid grid-cols-5 gap-2">
      {metrics.map((m) => (
        <React.Fragment key={m.label}>
          <div className="col-span-3">{m.label}</div>
          <div className="text-black font-bold text-right col-span-2">
            {m.value}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
