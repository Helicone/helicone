import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  TableCellsIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useState } from "react";

import { GraphDataState } from "../../../lib/dashboardGraphs";
import { middleTruncString } from "../../../lib/stringHelpers";
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
import ThemedTabs from "../../shared/themed/themedTabs";
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
    requestsOverTime: requestsOverTime.data ?? "loading",
  };

  return (
    <>
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
      {keys.length === 0 ? (
        <div className="space-y-16">
          <div className="text-center mt-24">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-xl font-medium text-gray-900">
              No OpenAI API Keys found
            </h3>
            <p className="mt-1 text-lg text-gray-500">
              Go to the welcome page to get started
            </p>
            <div className="mt-6">
              <Link
                href="/welcome"
                className="inline-flex items-center rounded-md bg-gradient-to-r from-sky-600 to-indigo-500 bg-origin-border px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <ArrowTopRightOnSquareIcon
                  className="-ml-1 mr-2 h-5 w-5"
                  aria-hidden="true"
                />
                Welcome Page
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <ThemedTableHeader
            isFetching={metrics.isLoading}
            timeFilter={{
              customTimeFilter: true,
              timeFilterOptions: [
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
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3">
              <TimeGraphWHeader
                data={timeData}
                timeMap={getTimeMap(timeFilter.start, timeFilter.end)}
              />
            </div>
            <div className="col-span-2 pt-[4.25rem] h-96">
              <div className="p-6 bg-white border border-gray-300 rounded-lg space-y-4 h-96 overflow-hidden">
                {/* <div className="w-full flex flex-row items-center justify-between">
                  <p className="text-md text-gray-700">
                    Top Users (coming soon)
                  </p>
                </div>
                <ul className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      className="h-8 w-full bg-gray-300 rounded-lg"
                      key={i}
                    />
                  ))}
                </ul> */}
                <div className="w-full h-full items-center justify-center align-middle flex flex-col">
                  <UserGroupIcon className="h-12 w-12 text-gray-500" />
                  <p className="text-md text-gray-700">
                    Top Users (coming soon)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;
