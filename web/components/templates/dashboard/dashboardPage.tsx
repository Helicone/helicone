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

import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedTableHeader from "../../shared/themed/themedTableHeader";
import ThemedTabs from "../../shared/themed/themedTabs";

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
import { useDashboardPage } from "./useDashboardPage";
import { useRouter } from "next/router";
import { useGetAuthorized } from "../../../services/hooks/dashboard";
import { User } from "@supabase/auth-helpers-nextjs";
import UpgradeProModal from "../../shared/upgradeProModal";
import LoadingAnimation from "../../shared/loadingAnimation";
import { RenderBarChart } from "../../shared/metrics/barChart";
import MainGraph from "./graphs/mainGraph";
import { DoubleAreaChartData } from "../../shared/metrics/doubleAreaChart";

interface DashboardPageProps {
  user: User;
}

function formatNumberString(
  numString: string,
  minimumFractionDigits?: boolean
) {
  const num = parseFloat(numString);
  if (minimumFractionDigits) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2 });
  } else {
    return num.toLocaleString("en-US");
  }
}

export type Loading<T> = T | "loading";

export type DashboardMode = "requests" | "costs" | "errors";

const DashboardPage = (props: DashboardPageProps) => {
  const { user } = props;
  const router = useRouter();
  const [interval, setInterval] = useState<TimeInterval>("24h");
  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo(interval),
    end: new Date(),
  });
  const [open, setOpen] = useState(false);

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

  const { authorized } = useGetAuthorized(user.id);

  const { metrics, filterMap, overTimeData, isAnyLoading } = useDashboardPage({
    timeFilter,
    uiFilters: debouncedAdvancedFilters,
    apiKeyFilter,
    timeZoneDifference,
    dbIncrement: timeIncrement,
  });

  const combineRequestsAndErrors = () => {
    let combinedArray = overTimeData.requests.data?.data?.map(
      (request, index) => ({
        time: request.time,
        value1: request.count,
        value2: overTimeData.errors.data?.data
          ? overTimeData.errors.data?.data[index].count
          : 0,
      })
    );
    return combinedArray;
  };

  const metricsData: MetricsPanelProps["metric"][] = [
    {
      value:
        metrics.totalCost.data?.data && metrics.totalRequests?.data?.data
          ? `$${(
              metrics.totalCost.data.data / metrics.totalRequests?.data?.data
            ).toFixed(3)}`
          : "$0.00",
      label: "Avg Cost/Req",
      icon: ChartBarIcon,
      isLoading: metrics.totalCost.isLoading || metrics.totalRequests.isLoading,
    },
    {
      value:
        metrics.averageTokensPerRequest?.data?.data &&
        metrics.totalRequests?.data?.data
          ? `${metrics.averageTokensPerRequest.data.data.average_prompt_tokens_per_response.toFixed(
              2
            )}`
          : "N/A",
      label: "Avg Prompt Tokens/Req",
      icon: ChartBarIcon,
      isLoading:
        metrics.averageTokensPerRequest.isLoading ||
        metrics.totalRequests.isLoading,
    },
    {
      value:
        metrics.averageTokensPerRequest?.data?.data &&
        metrics.totalRequests?.data?.data
          ? `${metrics.averageTokensPerRequest.data.data.average_completion_tokens_per_response.toFixed(
              2
            )}`
          : "N/A",
      label: "Avg Completion Tokens/Req",
      icon: ChartBarIcon,
      isLoading:
        metrics.averageTokensPerRequest.isLoading ||
        metrics.totalRequests.isLoading,
    },
    {
      value:
        metrics.averageTokensPerRequest?.data?.data &&
        metrics.totalRequests?.data?.data
          ? `${metrics.averageTokensPerRequest.data.data.average_total_tokens_per_response.toFixed(
              2
            )}`
          : "N/A",
      label: "Avg Total Tokens/Req",
      icon: ChartBarIcon,
      isLoading:
        metrics.averageTokensPerRequest.isLoading ||
        metrics.totalRequests.isLoading,
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
      {authorized ? (
        <div className="flex flex-col items-center justify-center h-[90vh]">
          <p className="text-2xl font-semibold text-gray-900">
            You have reached your monthly limit of 100,000 requests.
          </p>
          <p className="mt-4 text-lg font-semibold text-gray-700">
            Upgrade to a paid plan to view your dashboard.
          </p>
          <button
            onClick={() => {
              setOpen(true);
            }}
            className="mt-8 items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Upgrade to Pro
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <ThemedTableHeader
            isFetching={isAnyLoading}
            timeFilter={{
              customTimeFilter: true,
              timeFilterOptions: [
                { key: "24h", value: "24H" },
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

          {metrics.totalRequests?.data?.data === 0 ? (
            <div className="bg-white h-48 w-full rounded-lg border border-gray-300 py-2 px-4 flex flex-col space-y-3 justify-center items-center">
              <TableCellsIcon className="h-12 w-12 text-gray-400" />
              <p className="text-xl font-semibold text-gray-500">
                No Data Found
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto w-full grid grid-cols-1 sm:grid-cols-4 xl:grid-cols-12 text-gray-900 gap-4">
                {/* Combine the requests and error into one graph */}
                <div className="col-span-2 xl:col-span-12 h-full">
                  <MainGraph
                    isLoading={overTimeData.requests.isLoading}
                    dataOverTime={
                      overTimeData.requests.data?.data?.map((r) => ({
                        ...r,
                        value: r.count,
                      })) ?? []
                    }
                    doubleLineOverTime={combineRequestsAndErrors()}
                    timeMap={getTimeMap(timeIncrement)}
                    title={"Requests"}
                    value={
                      metrics.totalRequests?.data?.data
                        ? `${formatNumberString(
                            metrics.totalRequests?.data?.data.toFixed(2)
                          )}`
                        : "0"
                    }
                    valueLabel={"requests"}
                    type="double-line"
                  />
                </div>{" "}
                <div className="col-span-2 xl:col-span-4 h-full">
                  <MainGraph
                    isLoading={overTimeData.costs.isLoading}
                    dataOverTime={
                      overTimeData.costs.data?.data?.map((r) => ({
                        ...r,
                        value: r.cost,
                      })) ?? []
                    }
                    timeMap={getTimeMap(timeIncrement)}
                    title={"Costs"}
                    value={
                      metrics.totalCost.data?.data
                        ? `$${formatNumberString(
                            metrics.totalCost.data?.data.toFixed(2),
                            true
                          )}`
                        : "$0.00"
                    }
                    valueLabel={"cost"}
                    type="bar"
                    labelFormatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                </div>
                <div className="col-span-2 xl:col-span-4 h-full">
                  <MainGraph
                    isLoading={overTimeData.latency.isLoading}
                    dataOverTime={
                      overTimeData.latency.data?.data?.map((r) => ({
                        ...r,
                        value: r.duration,
                      })) ?? []
                    }
                    timeMap={getTimeMap(timeIncrement)}
                    title={"Latency"}
                    value={`${
                      metrics.averageLatency.data?.data?.toFixed(0) ?? 0
                    } ms / req`}
                    valueLabel={"latency"}
                    type={"area"}
                    labelFormatter={(value) =>
                      `${parseInt(value).toFixed(0)} ms`
                    }
                  />
                </div>
                <div className="col-span-2 xl:col-span-4 h-full">
                  <MainGraph
                    isLoading={overTimeData.users.isLoading}
                    dataOverTime={
                      overTimeData.users.data?.data?.map((r) => ({
                        ...r,
                        value: r.count,
                      })) ?? []
                    }
                    timeMap={getTimeMap(timeIncrement)}
                    title={"Active Users"}
                    value={metrics.activeUsers.data?.data ?? 0}
                    valueLabel={" Users"}
                    type={"bar"}
                  />
                </div>
                {metricsData.map((m, i) => (
                  <div
                    className="col-span-2 md:col-span-1 xl:col-span-3"
                    key={i}
                  >
                    <MetricsPanel metric={m} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <UpgradeProModal open={open} setOpen={setOpen} />
    </>
  );
};

export default DashboardPage;
