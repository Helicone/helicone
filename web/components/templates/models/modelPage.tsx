import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { ModelMetric } from "../../../lib/api/models/models";
import { Result } from "../../../lib/result";
import { Database } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import ThemedTable from "../../shared/themed/themedTable";
import ThemedTableHeader from "../../shared/themed/themedTableHeader";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useState } from "react";

interface ModelPageProps {}

const ModelPage = (props: ModelPageProps) => {
  const [interval, setInterval] = useState<TimeInterval>("all");
  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo(interval),
    end: new Date(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["modelMetrics", timeFilter],
    queryFn: async (query) => {
      return await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: "all",
          offset: 0,
          limit: 100,
          timeFilter,
        }),
      }).then((res) => res.json() as Promise<Result<ModelMetric[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  console.log(data?.data);
  return (
    <>
      <AuthHeader title={"Models"} />
      {isLoading ? (
        <LoadingAnimation title="Getting model metrics" />
      ) : (
        <div className="flex flex-col gap-5">
          <ThemedTableHeader
            isFetching={isLoading}
            timeFilter={{
              customTimeFilter: true,
              timeFilterOptions: [
                { key: "24h", value: "Today" },
                { key: "7d", value: "7D" },
                { key: "1m", value: "1M" },
                { key: "3m", value: "3M" },
                { key: "all", value: "All" },
              ],
              defaultTimeFilter: interval,
              onTimeSelectHandler: (key: TimeInterval, value: string) => {
                if ((key as string) === "custom") {
                  value = value.replace("custom:", "");
                  const start = new Date(value.split("_")[0]);
                  const end = new Date(value.split("_")[1]);
                  setInterval(key);
                  setTimeFilter({
                    start,
                    end,
                  });
                } else {
                  setInterval(key);
                  setTimeFilter({
                    start: getTimeIntervalAgo(key),
                    end: new Date(),
                  });
                }
              },
            }}
          />
          <ThemedTable
            columns={[
              { name: "Model", key: "model", hidden: false },
              { name: "Requests", key: "total_requests", hidden: false },
              {
                name: "Prompt Tokens",
                key: "total_prompt_token",
                hidden: true,
              },
              {
                name: "Completion Tokens",
                key: "total_completion_tokens",
                hidden: true,
              },
              { name: "Total Tokens", key: "total_tokens", hidden: false },

              { name: "Cost (USD)", key: "cost", hidden: false },
            ]}
            rows={data?.data ?? []}
          />
        </div>
      )}
    </>
  );
};

export default ModelPage;
