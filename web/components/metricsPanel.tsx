import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { MetricsDB } from "../schema/metrics";

export function MetricsPanel() {
  const client = useSupabaseClient();
  interface Metrics {
    request_today: number;
    average_requests_per_day: number;
    average_response_time: number;
    average_tokens_per_request: number;
    average_tokens_per_response: number;
    average_cost_per_request: number;
    total_requests: number;
  }

  const [data, setData] = useState<Metrics | null>(null);
  console.log("data", data);
  const metrics = [
    {
      value: data?.request_today ?? "n/a",
      label: "Requests today",
    },
    {
      value: data?.average_requests_per_day.toFixed(3) ?? "n/a",
      label: "Average requests per day",
    },
    {
      value: data?.average_response_time.toFixed(3) ?? "n/a",
      label: "Average response time",
    },
    {
      value: data?.average_tokens_per_response.toFixed(3) ?? "n/a",
      label: "Average # of Token/response",
    },
    {
      value: data?.average_cost_per_request ?? "n/a",
      label: "Average cost/request",
    },
    {
      value: data?.total_requests ?? "n/a",
      label: "Total requests",
    },
  ];
  useEffect(() => {
    const fetch = async () => {
      const { count: requestToday, error: requestTodayError } = await client
        .from("response")
        .select("*", {
          count: "exact",
          head: true,
        })
        .gte("created_at", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false });

      const {
        data: metrics,
        error: metricsError,
      }: { data: MetricsDB | null; error: PostgrestError | null } = await client
        .from("metrics")
        .select("*")
        .single();

      if (metricsError !== null) {
        console.error(metricsError);
      } else if (requestTodayError !== null) {
        console.error(requestTodayError);
      } else {
        setData({
          request_today: requestToday!, //TODO
          average_cost_per_request: undefined!,
          ...metrics!,
        });
      }
    };
    fetch();
  }, [client]);

  return (
    <div className="grid grid-cols-5 gap-2">
      {metrics.map((m) => (
        <>
          <div className="col-span-3">{m.label}</div>
          <div className="text-indigo-400 font-bold text-right col-span-2">
            {m.value}
          </div>
        </>
      ))}
    </div>
  );
}
