import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useState } from "react";

import { GraphDataState } from "../../../lib/dashboardGraphs";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";

import { Database } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import AuthLayout from "../../shared/layout/authLayout";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedTableHeader from "../../shared/themed/themedTableHeader";
import { Filters } from "./filters";

import { MetricsPanel } from "./metricsPanel";
import TimeGraphWHeader from "./timeGraphWHeader";
import { useDashboardPage } from "./useDashboardPage";

interface DashboardPageProps {
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

type LiveLogType = {
  id: string;
  requestMsg: string;
  model?: string;
  createdAt?: string;
  totalTokens?: number;
  latency?: number; // in ms
  responseMsg?: string;
};

export type Loading<T> = T | "loading";

const DashboardPage = (props: DashboardPageProps) => {
  const { keys } = props;
  const [interval, setInterval] = useState<TimeInterval>("24h");
  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo(interval),
    end: new Date(),
  });

  const sessionStorageKey =
    typeof window !== "undefined" ? sessionStorage.getItem("currentKey") : null;

  const [apiKeyFilter, setApiKeyFilter] = useState<string | null>(
    sessionStorageKey
  );

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);

  const debouncedAdvancedFilters = useDebounce(advancedFilters, 500);

  const {
    metrics,
    filterMap,
    errorsOverTime,
    requestsOverTime,
    costOverTime,
    searchPropertyFilters,
  } = useDashboardPage({
    timeFilter,
    uiFilters: debouncedAdvancedFilters,
    apiKeyFilter,
  });

  const timeData: GraphDataState = {
    costOverTime: costOverTime.data ?? "loading",
    errorOverTime: errorsOverTime.data ?? "loading",
    requestsOverTime: requestsOverTime.data ?? "loading",
  };

  return (
    <div>
      <AuthHeader
        title={"Dashboard"}
        headerActions={
          <button
            onClick={() => {
              setTimeFilter({
                start: getTimeIntervalAgo(interval),
                end: new Date(),
              });
            }}
            className="font-medium text-black text-sm items-center flex flex-row hover:text-sky-700"
          >
            <ArrowPathIcon
              className={clsx(
                metrics.isLoading ? "animate-spin" : "",
                "h-5 w-5 inline"
              )}
            />
          </button>
        }
        actions={<Filters keys={keys} setFilter={setApiKeyFilter} />}
      />

      <div className="space-y-8">
        <ThemedTableHeader
          isFetching={metrics.isLoading}
          timeFilter={{
            customTimeFilter: true,
            timeFilterOptions: [
              // { key: "1h", value: "Last Hour" },
              { key: "24h", value: "Today" },
              { key: "7d", value: "7D" },
              { key: "1m", value: "1M" },
              { key: "3m", value: "3M" },
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
          advancedFilter={{
            filterMap,
            onAdvancedFilter: setAdvancedFilters,
            filters: advancedFilters,
            searchPropertyFilters,
          }}
        />
        <MetricsPanel metrics={metrics.data ?? "loading"} />
        <TimeGraphWHeader
          data={timeData}
          timeMap={getTimeMap(timeFilter.start, timeFilter.end)}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
