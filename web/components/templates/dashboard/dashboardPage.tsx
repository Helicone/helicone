import {
  ArrowPathIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

import { getTimeMap } from "../../../lib/timeCalculations/constants";
import {
  getTimeInterval,
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";

import { Database } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedTableHeader from "../../shared/themed/themedTableHeader";
import ThemedTabs from "../../shared/themed/themedTabs";
import { Filters } from "./filters";

import {
  filterListToTree,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import { userTableFilters } from "../../../services/lib/filters/frontendFilterDefs";
import {
  MetricsPanel,
  MetricsPanelProps,
} from "../../shared/metrics/metricsPanel";
import { Toggle } from "../../shared/themed/themedToggle";
import CostPanel from "./panels/costsPanel";
import ErrorsPanel from "./panels/errorsPanel";
import RequestsPanel from "./panels/requestsPanel";
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

export type DashboardMode = "requests" | "costs" | "errors";

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

  const [mode, setMode] = useState<DashboardMode>("requests");
  const [timeZoneDifference, setTimeZoneDifference] = useState<number>(
    new Date().getTimezoneOffset()
  );
  const timeIncrement = getTimeInterval(timeFilter);

  const { metrics, filterMap, overTimeData, errorMetrics, isAnyLoading } =
    useDashboardPage({
      timeFilter,
      uiFilters: debouncedAdvancedFilters,
      apiKeyFilter,
      timeZoneDifference,
      dbIncrement: timeIncrement,
    });

  const renderPanel = () => {
    if (mode === "requests") {
      return (
        <RequestsPanel
          requestsOverTime={overTimeData.requests.data?.data ?? []}
          isLoading={
            overTimeData.requests.isLoading || overTimeData.requests.isLoading
          }
          timeMap={getTimeMap(timeIncrement)}
          advancedFilters={filterListToTree(
            filterUIToFilterLeafs(userTableFilters, debouncedAdvancedFilters),
            "and"
          )}
        />
      );
    } else if (mode === "costs") {
      return (
        <CostPanel
          costOverTime={overTimeData.costs.data ?? "loading"}
          timeMap={getTimeMap(timeIncrement)}
          advancedFilters={filterListToTree(
            filterUIToFilterLeafs(userTableFilters, debouncedAdvancedFilters),
            "and"
          )}
        />
      );
    } else if (mode === "errors") {
      return (
        <ErrorsPanel
          errorsOverTime={overTimeData.errors.data ?? "loading"}
          errorMetrics={errorMetrics.errorCodes}
        />
      );
    }
  };

  const metricsData: MetricsPanelProps["metric"][] = [
    {
      value: metrics.totalCost.data?.data
        ? `$${metrics.totalCost.data?.data.toFixed(2)}`
        : "$0.00",
      label: "Total Cost",
      labelUnits: "(estimated)",
      icon: CurrencyDollarIcon,
      isLoading: metrics.totalCost.isLoading,
      onInformationHref:
        "https://docs.helicone.ai/how-it-works/how-we-calculate-costs",
    },
    {
      value: +(metrics.totalRequests?.data?.data?.toFixed(2) ?? 0),
      label: "Total Requests",
      icon: TableCellsIcon,
      isLoading: metrics.totalRequests.isLoading,
    },
    {
      value:
        metrics.totalCost.data?.data && metrics.totalRequests?.data?.data
          ? `$${(
              metrics.totalCost.data.data / metrics.totalRequests?.data?.data
            ).toFixed(5)}`
          : "$0.00",
      label: "Avg Cost/Req",
      icon: ChartBarIcon,
      isLoading: metrics.totalCost.isLoading || metrics.totalRequests.isLoading,
    },
    {
      value: metrics.averageLatency.data?.data?.toFixed(2) ?? "n/a",
      label: "Avg Latency/Req",
      labelUnits: "ms",
      icon: CloudArrowDownIcon,
      isLoading: metrics.averageLatency.isLoading,
    },
  ];

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
                isAnyLoading ? "animate-spin" : "",
                "h-5 w-5 inline"
              )}
            />
          </button>
        }
        actions={
          <div className="flex flex-row items-center gap-5">
            <Filters keys={keys} setFilter={setApiKeyFilter} />
            <div className="flex flex-row gap-1 items-center">
              UTC
              <Toggle
                onChange={(checked) => {
                  if (checked) {
                    setTimeZoneDifference(0);
                  } else {
                    setTimeZoneDifference(new Date().getTimezoneOffset());
                  }
                }}
              />
            </div>
          </div>
        }
      />

      <div className="space-y-8">
        <ThemedTableHeader
          isFetching={isAnyLoading}
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
            searchPropertyFilters: () => {
              throw new Error("not implemented");
            },
          }}
        />
        <div className="mx-auto w-full grid grid-cols-1 sm:grid-cols-4 text-gray-900 gap-4">
          {metricsData.map((m, i) => (
            <MetricsPanel key={i} metric={m} />
          ))}
        </div>

        <ThemedTabs
          options={[
            {
              icon: TableCellsIcon,
              label: "Requests",
            },
            {
              icon: CurrencyDollarIcon,
              label: "Costs",
            },
            {
              icon: ExclamationCircleIcon,
              label: "Errors",
            },
          ]}
          onOptionSelect={(option) =>
            setMode(option.toLowerCase() as DashboardMode)
          }
        />
        {renderPanel()}
      </div>
    </>
  );
};

export default DashboardPage;
