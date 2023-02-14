import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { FilterLeaf, FilterNode } from "../../../lib/api/metrics/filters";
import { Metrics } from "../../../lib/api/metrics/metrics";
import { Result } from "../../../lib/result";
import { MetricsDB } from "../../../schema/metrics";
import { Database } from "../../../supabase/database.types";

const OPENAI_COSTS = {
  ada: 0.0004,
  babbage: 0.0005,
  curie: 0.002,
  davinci: 0.02,
};

const OPENAI_FINETUNE_COSTS = {
  ada: 0.0016,
  babbage: 0.0024,
  curie: 0.012,
  davinci: 0.12,
};

export function modelCost(
  modelRow: Database["public"]["Views"]["model_metrics"]["Row"]
): number {
  const model = modelRow.model;
  const tokens = modelRow.sum_tokens;
  if (tokens === null) {
    console.error("Tokens is null");
    return 0;
  }
  if (model === null) {
    console.error("Model is null");
    return 0;
  }
  const is_finetuned_model = model.includes(":");

  if (!is_finetuned_model && model.includes("code")) {
    return 0;
  }

  const model_prefix = is_finetuned_model ? model.split(":")[0] : model;

  const costs = is_finetuned_model ? OPENAI_FINETUNE_COSTS : OPENAI_COSTS;

  const cost = Object.entries(costs).find(([key]) =>
    model_prefix.includes(key)
  )?.[1];
  if (!cost) {
    console.error("No cost found for model", model);
    return 0;
  }
  return (cost * tokens) / 1000;
}

export function MetricsPanel(props: MetricsPanelProps) {
  const { filters } = props;

  const [data, setData] = useState<Metrics | null>(null);

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
  useEffect(() => {
    fetch("/api/metrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filters),
    })
      .then((res) => res.json() as Promise<Result<Metrics, string>>)
      .then(({ data, error }) => {
        if (error !== null) {
          console.error(error);
          return;
        }
        setData({
          ...data,
          last_request: new Date(data.last_request),
          first_request: new Date(data.first_request),
        });
      });
  }, [filters]);

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
