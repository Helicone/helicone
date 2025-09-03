import { HeliconeUser } from "@/packages/common/auth/types";
import { TimeFilter } from "@/types/timeFilter";
import {
  ArrowPathIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";
import { AreaChart, BarChart, BarList, Card } from "@tremor/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Responsive, ResponsiveProps, WidthProvider } from "react-grid-layout";
import {
  getIncrementAsMinutes,
  getTimeMap,
} from "../../../lib/timeCalculations/constants";
import {
  getTimeInterval,
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useOrg } from "../../layout/org/organizationContext";

import { useFilterStore } from "@/filterAST/store/filterStore";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";
import { FilterLeaf } from "@helicone-package/filters/filterDefs";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import {
  MetricsPanel,
  MetricsPanelProps,
} from "../../shared/metrics/metricsPanel";
import ThemedTableHeader from "../../shared/themed/themedHeader";
import { ThemedSwitch } from "../../shared/themed/themedSwitch";
import UpgradeProModal from "../../shared/upgradeProModal";
import { formatLargeNumber } from "../../shared/utils/numberFormat";
import useSearchParams from "../../shared/utils/useSearchParams";
import UnauthorizedView from "../requests/UnauthorizedView";
import DashboardEmptyState from "./DashboardEmptyState";
import { INITIAL_LAYOUT, SMALL_LAYOUT } from "./gridLayouts";
import {
  getMockMetrics,
  getMockModels,
  getMockOverTimeData,
} from "./mockDashboardData";
import CountryPanel from "./panels/countryPanel";
import { ScoresPanel } from "./panels/scores/scoresPanel";
import { QuantilesGraph } from "./quantilesGraph";
import StyledAreaChart from "./styledAreaChart";
import SuggestionModal from "./suggestionsModal";
import { useDashboardPage } from "./useDashboardPage";
import DashboardChartTooltipContent from "./DashboardChartTooltipContent";
const ResponsiveGridLayout = WidthProvider(Responsive) as React.ComponentType<
  ResponsiveProps & { children?: React.ReactNode }
>;

interface DashboardPageProps {
  user: HeliconeUser;
}

export type Loading<T> = T | "loading";

export type DashboardMode = "requests" | "costs" | "errors";

const DashboardPage = (props: DashboardPageProps) => {
  const { user } = props;
  const searchParams = useSearchParams();
  const orgContext = useOrg();
  const filterStore = useFilterStore();
  const filters = filterStore.filter
    ? toFilterNode(filterStore.filter)
    : ({} as FilterLeaf);

  const shouldShowMockData = orgContext?.currentOrg?.has_onboarded === false;

  // TODO: Move this to a hook and consolidate with the request page
  // Make the hook called like "useTimeFilter"
  const getTimeFilter = () => {
    const currentTimeFilter = searchParams.get("t");
    let range: TimeFilter;

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const start = currentTimeFilter.split("_")[1]
        ? new Date(currentTimeFilter.split("_")[1])
        : getTimeIntervalAgo("24h");
      const end = new Date(currentTimeFilter.split("_")[2] || new Date());
      range = {
        start,
        end,
      };
    } else {
      range = {
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "1m"),
        end: new Date(),
      };
    }
    return range;
  };

  const [interval, setInterval] = useState<TimeInterval>(
    (() => {
      const currentTimeFilter = searchParams.get("t") as TimeInterval;
      if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
        return "custom";
      } else {
        return currentTimeFilter || "24h";
      }
    })(),
  );
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(getTimeFilter());

  const [open, setOpen] = useState(false);

  const timeIncrement = useMemo(
    () => getTimeInterval(timeFilter),
    [timeFilter],
  );

  const mockOverTimeData = useMemo(
    () => getMockOverTimeData(timeIncrement),
    [timeIncrement],
  );

  const { unauthorized, currentTier } = useGetUnauthorized(user.id);

  const [isLive, setIsLive] = useLocalStorage("isLive-DashboardPage", false);

  useEffect(() => {
    if (orgContext?.currentOrg?.tier === "demo") {
      setIsLive(true);
    }
  }, [orgContext?.currentOrg?.tier]);

  const {
    metrics: realMetrics,
    overTimeData: realOverTimeData,
    isAnyLoading,
    refetch,
    models: realModels,
    isModelsLoading,
  } = useDashboardPage({
    timeFilter,
    timeZoneDifference: new Date().getTimezoneOffset(),
    dbIncrement: timeIncrement,
    isLive,
  });

  const mockMetrics = useMemo(() => getMockMetrics(), []);
  const mockModels = useMemo(() => getMockModels(), []);

  const metrics = shouldShowMockData ? mockMetrics : realMetrics;
  const overTimeData = shouldShowMockData ? mockOverTimeData : realOverTimeData;
  const models = shouldShowMockData
    ? { data: mockModels.data, isLoading: false }
    : realModels;

  const metricsData: MetricsPanelProps["metric"][] = [
    {
      id: "cost-req",
      value:
        metrics.totalCost.data?.data && metrics.totalRequests?.data?.data
          ? `$${formatLargeNumber(
              metrics.totalCost.data.data / metrics.totalRequests?.data?.data,
            )}`
          : "$0.00",
      label: "Avg Cost / Req",
      icon: ChartBarIcon,
      isLoading: metrics.totalCost.isLoading || metrics.totalRequests.isLoading,
    },
    {
      id: "prompt-tokens",
      value:
        metrics.averageTokensPerRequest?.data?.data &&
        metrics.totalRequests?.data?.data
          ? formatLargeNumber(
              metrics.averageTokensPerRequest.data.data
                .average_prompt_tokens_per_response,
            )
          : "n/a",
      label: "Avg Prompt Tokens / Req",
      icon: ChartBarIcon,
      isLoading:
        metrics.averageTokensPerRequest.isLoading ||
        metrics.totalRequests.isLoading,
    },
    {
      id: "completion-tokens",
      value:
        metrics.averageTokensPerRequest?.data?.data &&
        metrics.totalRequests?.data?.data
          ? formatLargeNumber(
              metrics.averageTokensPerRequest.data.data
                .average_completion_tokens_per_response,
            )
          : "n/a",
      label: "Avg Completion Tokens / Req",
      icon: ChartBarIcon,
      isLoading:
        metrics.averageTokensPerRequest.isLoading ||
        metrics.totalRequests.isLoading,
    },
    {
      id: "total-tokens",
      value:
        metrics.averageTokensPerRequest?.data?.data &&
        metrics.totalRequests?.data?.data
          ? formatLargeNumber(
              metrics.averageTokensPerRequest.data.data
                .average_total_tokens_per_response,
            )
          : "n/a",
      label: "Avg Total Tokens / Req",
      icon: ChartBarIcon,
      isLoading:
        metrics.averageTokensPerRequest.isLoading ||
        metrics.totalRequests.isLoading,
    },
  ];

  const gridCols = { lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 };

  const listColors = ["purple", "blue", "green", "yellow", "orange"];

  // put this forEach inside of a useCallback to prevent unnecessary re-renders
  const getStatusCountsOverTime = useCallback(() => {
    const statusCounts: {
      // overtime should be an array of objects with a time and a count
      overTime: { [key: string]: { success: number; error: number } };
      accStatusCounts: { [key: string]: number };
    } = {
      overTime: {},
      accStatusCounts: {},
    };

    overTimeData.requestsWithStatus.data?.data?.forEach((d) => {
      // data parsing for requests and errors over time graph
      const formattedTime = new Date(d.time).toUTCString();
      if (statusCounts.overTime[formattedTime] === undefined) {
        statusCounts.overTime[formattedTime] = {
          success: 0,
          error: 0,
        };
      }
      if (d.status === 200) {
        statusCounts.overTime[formattedTime]["success"] += d.count;
      } else {
        statusCounts.overTime[formattedTime]["error"] += d.count;
      }

      // do not count 200s
      if (d.status === 200) {
        return;
      }

      // data parsing for error graph
      if (statusCounts.accStatusCounts[d.status] === undefined) {
        statusCounts.accStatusCounts[d.status] = 0;
      }
      statusCounts.accStatusCounts[d.status] += d.count;
    });

    return statusCounts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overTimeData.requestsWithStatus.data?.data, timeIncrement]);

  // flatten the status counts over time
  const flattenedOverTime = Object.entries(
    getStatusCountsOverTime().overTime,
  ).map(([time, counts]) => {
    return {
      date: getTimeMap(timeIncrement)(new Date(time)),
      success: counts.success,
      error: counts.error,
    };
  });

  const accumulatedStatusCounts = Object.entries(
    getStatusCountsOverTime().accStatusCounts,
  )
    .map(([name, value]) => {
      if (name === "-1") {
        name = "timeout";
      } else if (name === "-2") {
        name = "pending";
      } else if (name === "-3") {
        name = "cancelled";
      } else if (name === "-4") {
        name = "threat";
      }
      return {
        name,
        value,
      };
    })
    .filter((d) => d.value !== 0);

  const [openSuggestGraph, setOpenSuggestGraph] = useState(false);

  return (
    <>
      <div className="px-8">
        {!shouldShowMockData && (
          <AuthHeader
            isWithinIsland={true}
            title={"Dashboard"}
            headerActions={
              <button
                onClick={() => {
                  refetch();
                }}
                className="flex flex-row items-center text-sm font-semibold text-black hover:text-sky-700 dark:text-white"
              >
                <ArrowPathIcon
                  className={clsx(
                    isAnyLoading || isLive ? "animate-spin" : "",
                    "inline h-5 w-5",
                  )}
                />
              </button>
            }
            actions={
              <div>
                <ThemedSwitch
                  checked={isLive}
                  onChange={setIsLive}
                  label="Live"
                />
              </div>
            }
          />
        )}
        {unauthorized ? (
          <UnauthorizedView currentTier={currentTier || ""} />
        ) : (
          <div className={`${shouldShowMockData ? "pt-6" : "mt-2 space-y-4"}`}>
            <ThemedTableHeader
              isFetching={isAnyLoading || isModelsLoading}
              timeFilter={
                shouldShowMockData
                  ? undefined
                  : {
                      currentTimeFilter: timeFilter,
                      customTimeFilter: true,
                      timeFilterOptions: [],
                      defaultTimeFilter: interval,
                      onTimeSelectHandler: (
                        key: TimeInterval,
                        value: string,
                      ) => {
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
                      isLive: isLive,
                      hasCustomTimeFilter:
                        searchParams.get("t")?.startsWith("custom_") || false,
                      onClearTimeFilter: () => {
                        searchParams.delete("t");
                        setInterval("24h");
                        setTimeFilter({
                          start: getTimeIntervalAgo("24h"),
                          end: new Date(),
                        });
                      },
                    }
              }
              savedFilters={undefined}
            />
            <section id="panels" className="-m-2">
              <ResponsiveGridLayout
                className="layout"
                layouts={{
                  lg: INITIAL_LAYOUT,
                  md: INITIAL_LAYOUT,
                  sm: INITIAL_LAYOUT,
                  xs: SMALL_LAYOUT,
                  xxs: SMALL_LAYOUT,
                }}
                autoSize={true}
                isBounded={true}
                isDraggable={false}
                breakpoints={{ lg: 1200, md: 996, sm: 600, xs: 360, xxs: 0 }}
                cols={gridCols}
                rowHeight={96}
              >
                {metricsData.map((m) => (
                  <div key={m.id}>
                    <MetricsPanel metric={m} />
                  </div>
                ))}
                <div key="requests">
                  <Card className="rounded-lg border border-slate-200 bg-white text-slate-950 !shadow-sm ring-0 dark:border-slate-800 dark:bg-black dark:text-slate-50">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm text-slate-500">Requests</p>
                        <p className="text-xl font-semibold text-slate-950 dark:text-slate-50">
                          {metrics.totalRequests?.data?.data
                            ? `${formatNumberString(
                                metrics.totalRequests?.data?.data.toFixed(2),
                              )}`
                            : "0"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={clsx("p-2", "w-full")}
                      style={{
                        height: "212px",
                      }}
                    >
                      {overTimeData.requests.isLoading ? (
                        <div className="h-full w-full rounded-md bg-slate-200 pt-4 dark:bg-slate-800">
                          <LoadingAnimation height={175} width={175} />
                        </div>
                      ) : (
                        <AreaChart
                          customTooltip={DashboardChartTooltipContent}
                          className="h-[14rem]"
                          data={flattenedOverTime}
                          index="date"
                          categories={["success", "error"]}
                          colors={["green", "red"]}
                          showYAxis={false}
                          curveType="monotone"
                          animationDuration={1000}
                          showAnimation={true}
                        />
                      )}
                    </div>
                  </Card>
                </div>
                <div key="errors">
                  <Card className="flex h-full w-full flex-col rounded-lg border border-slate-200 bg-white text-slate-950 !shadow-sm ring-0 dark:border-slate-800 dark:bg-black dark:text-slate-50">
                    <div className="flex h-full flex-col">
                      <h2 className="mb-2 text-sm text-slate-500">
                        All Errors
                      </h2>
                      {(() => {
                        const totalErrors = accumulatedStatusCounts.reduce(
                          (sum, e) => sum + e.value,
                          0,
                        );
                        const errorPercentage =
                          (totalErrors /
                            (metrics.totalRequests?.data?.data ?? 1)) *
                            100 || 0;
                        return (
                          <div className="mb-2 text-sm">
                            <span className="font-semibold">
                              {formatLargeNumber(totalErrors)}
                            </span>{" "}
                            total errors (
                            <span className="font-semibold">
                              {errorPercentage.toFixed(2)}%
                            </span>{" "}
                            of all requests)
                          </div>
                        );
                      })()}
                      <div className="flex flex-grow flex-col overflow-hidden">
                        <div className="flex flex-row items-center justify-between pb-2">
                          <p className="text-xs font-semibold text-slate-700">
                            Error Type
                          </p>
                          <p className="text-xs font-semibold text-slate-700">
                            Percentage
                          </p>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                          <BarList
                            data={(() => {
                              const totalErrors =
                                accumulatedStatusCounts.reduce(
                                  (sum, e) => sum + e.value,
                                  0,
                                );
                              return accumulatedStatusCounts
                                .sort((a, b) => b.value - a.value)
                                .map((error, index) => ({
                                  name: `${error.name} (${formatLargeNumber(
                                    error.value,
                                  )})`,
                                  value: (error.value / totalErrors) * 100,
                                  color: listColors[index % listColors.length],
                                }));
                            })()}
                            className="h-full"
                            showAnimation={true}
                            valueFormatter={(value: number) =>
                              `${value.toFixed(1)}%`
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                <div key="models">
                  <StyledAreaChart
                    title={`Top Models`}
                    value={undefined}
                    isDataOverTimeLoading={isModelsLoading}
                    withAnimation={true}
                  >
                    <div className="flex flex-row items-center justify-between pb-2">
                      <p className="text-xs font-semibold text-slate-700">
                        Name
                      </p>
                      <p className="text-xs font-semibold text-slate-700">
                        Requests
                      </p>
                    </div>
                    <BarList
                      data={
                        models?.data
                          ?.map((model, index) => ({
                            name: model.model || "n/a",
                            value: model.total_requests,
                            color: listColors[index % listColors.length],
                          }))
                          .sort(
                            (a, b) =>
                              b.value - a.value - (b.name === "n/a" ? 1 : 0),
                          ) ?? []
                      }
                      className="h-full overflow-auto"
                      showAnimation={true}
                    />
                  </StyledAreaChart>
                </div>
                <div key="costs">
                  <StyledAreaChart
                    title={"Costs"}
                    value={
                      metrics.totalCost.data?.data
                        ? `$${formatNumberString(
                            metrics.totalCost.data?.data < 0.02
                              ? metrics.totalCost.data?.data.toFixed(7)
                              : metrics.totalCost.data?.data.toFixed(2),
                            true,
                          )}`
                        : "$0.00"
                    }
                    isDataOverTimeLoading={overTimeData.costs.isLoading}
                  >
                    <BarChart
                      customTooltip={DashboardChartTooltipContent}
                      className="h-[14rem]"
                      data={
                        overTimeData.costs.data?.data?.map((r) => ({
                          date: getTimeMap(timeIncrement)(r.time),
                          costs: r.cost,
                        })) ?? []
                      }
                      index="date"
                      categories={["costs"]}
                      colors={["blue"]}
                      showYAxis={false}
                      valueFormatter={(number: number | bigint) =>
                        `$ ${new Intl.NumberFormat("us")
                          .format(number)
                          .toString()}`
                      }
                    />
                  </StyledAreaChart>
                </div>
                <div key="users">
                  <StyledAreaChart
                    title={"Users"}
                    value={
                      metrics.activeUsers.data?.data
                        ? formatLargeNumber(metrics.activeUsers.data?.data)
                        : "0"
                    }
                    isDataOverTimeLoading={overTimeData.users.isLoading}
                  >
                    <BarChart
                      customTooltip={DashboardChartTooltipContent}
                      className="h-[14rem]"
                      data={
                        overTimeData.users.data?.data?.map((r) => ({
                          date: getTimeMap(timeIncrement)(r.time),
                          users: r.count,
                        })) ?? []
                      }
                      index="date"
                      categories={["users"]}
                      colors={["orange"]}
                      showYAxis={false}
                    />
                  </StyledAreaChart>
                </div>
                <div key="countries">
                  <CountryPanel timeFilter={timeFilter} userFilters={filters} />
                </div>
                <div key="scores">
                  <ScoresPanel
                    timeFilter={timeFilter}
                    userFilters={filters}
                    dbIncrement={timeIncrement}
                  />
                </div>
                <div key="scores-bool">
                  <ScoresPanel
                    timeFilter={timeFilter}
                    userFilters={filters}
                    dbIncrement={timeIncrement}
                    filterBool={true}
                  />
                </div>
                <div key="latency">
                  <StyledAreaChart
                    title={"Latency"}
                    value={`${new Intl.NumberFormat("us").format(
                      (metrics.averageLatency.data?.data ?? 0) / 1000,
                    )} s / req`}
                    isDataOverTimeLoading={overTimeData.latency.isLoading}
                  >
                    <AreaChart
                      customTooltip={DashboardChartTooltipContent}
                      className="h-[14rem]"
                      data={
                        overTimeData.latency.data?.data?.map((r) => ({
                          date: getTimeMap(timeIncrement)(r.time),
                          latency: r.duration,
                        })) ?? []
                      }
                      index="date"
                      categories={["latency"]}
                      colors={["cyan"]}
                      showYAxis={false}
                      curveType="monotone"
                      valueFormatter={(number: number | bigint) => {
                        return `${new Intl.NumberFormat("us").format(
                          Number(number) / 1000,
                        )} s`;
                      }}
                    />
                  </StyledAreaChart>
                </div>
                <div key="quantiles">
                  <QuantilesGraph
                    filters={filters}
                    timeFilter={timeFilter}
                    timeIncrement={timeIncrement}
                  />
                </div>
                <div key="time-to-first-token">
                  <StyledAreaChart
                    title={"Time to First Token"}
                    value={`Average: ${new Intl.NumberFormat("us").format(
                      metrics.averageTimeToFirstToken.data?.data ?? 0,
                    )} ms`}
                    isDataOverTimeLoading={
                      overTimeData.timeToFirstToken.isLoading
                    }
                  >
                    <AreaChart
                      customTooltip={DashboardChartTooltipContent}
                      className="h-[14rem]"
                      data={
                        overTimeData.timeToFirstToken.data?.data?.map((r) => ({
                          date: getTimeMap(timeIncrement)(r.time),
                          time: r.ttft,
                        })) ?? []
                      }
                      index="date"
                      categories={["time"]}
                      colors={["violet"]}
                      showYAxis={false}
                      curveType="monotone"
                      valueFormatter={(number: number | bigint) => {
                        return `${new Intl.NumberFormat("us").format(
                          number,
                        )} ms`;
                      }}
                    />
                  </StyledAreaChart>
                </div>
                <div key="threats">
                  <StyledAreaChart
                    title={"Threats"}
                    value={`${formatLargeNumber(
                      Number(metrics.totalThreats.data?.data?.toFixed(0) ?? 0),
                    )}`}
                    isDataOverTimeLoading={overTimeData.threats.isLoading}
                  >
                    <AreaChart
                      customTooltip={DashboardChartTooltipContent}
                      className="h-[14rem]"
                      data={
                        overTimeData.threats.data?.data?.map((r) => ({
                          date: getTimeMap(timeIncrement)(r.time),
                          threats: r.count,
                        })) ?? []
                      }
                      index="date"
                      categories={["threats"]}
                      colors={["amber"]}
                      showYAxis={false}
                      curveType="monotone"
                    />
                  </StyledAreaChart>
                </div>
                <div key="suggest-more-graphs">
                  <div className="flex h-full w-full flex-col items-center justify-center space-y-2 rounded-lg border border-dashed border-slate-200 bg-white p-2 text-slate-950 shadow-sm dark:border-slate-900 dark:bg-black dark:text-slate-50">
                    <PresentationChartLineIcon className="h-12 w-12 text-black dark:text-white" />
                    <button
                      className="text-semibold p-4 text-lg"
                      onClick={() => {
                        setOpenSuggestGraph(true);
                      }}
                    >
                      Request a new graph
                    </button>
                    <div className="max-w-xs text-center text-sm text-slate-500">
                      Or use our{" "}
                      <a
                        href="https://docs.helicone.ai/getting-started/integration-method/posthog"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 underline"
                      >
                        PostHog integration
                      </a>{" "}
                      to create custom graphs or get started with our pre-built
                      template.
                    </div>
                  </div>
                </div>
                <div key="tokens-per-min-over-time">
                  <StyledAreaChart
                    title={"Tokens / Minute"}
                    value={`Max: ${formatLargeNumber(
                      max(
                        overTimeData.promptTokensOverTime.data?.data
                          ?.map((d) => d.completion_tokens + d.prompt_tokens)
                          .filter((d) => d !== 0) ?? [],
                      ) /
                        Number(getIncrementAsMinutes(timeIncrement).toFixed(2)),
                    )} tokens`}
                    isDataOverTimeLoading={overTimeData.users.isLoading}
                  >
                    <AreaChart
                      customTooltip={DashboardChartTooltipContent}
                      className="h-[14rem]"
                      data={
                        overTimeData.promptTokensOverTime.data?.data?.map(
                          (r) => ({
                            date: getTimeMap(timeIncrement)(r.time),
                            "Prompt / min":
                              (r.prompt_tokens + 0.0) /
                              getIncrementAsMinutes(timeIncrement),

                            "Completion / min":
                              (r.completion_tokens + 0.0) /
                              getIncrementAsMinutes(timeIncrement),
                            "Total / min":
                              (r.prompt_tokens + r.completion_tokens + 0.0) /
                              getIncrementAsMinutes(timeIncrement),
                          }),
                        ) ?? []
                      }
                      index="date"
                      categories={[
                        "Prompt / min",
                        "Completion / min",
                        "Total / min",
                      ]}
                      colors={[
                        "cyan",
                        "blue",
                        "green",
                        "indigo",
                        "orange",
                        "pink",
                      ]}
                      showYAxis={false}
                      curveType="monotone"
                      valueFormatter={(number: number | bigint) =>
                        `${new Intl.NumberFormat("us").format(number)} tokens`
                      }
                    />
                  </StyledAreaChart>
                </div>
              </ResponsiveGridLayout>
              <div className="relative">
                {shouldShowMockData && <DashboardEmptyState isVisible={true} />}
              </div>
            </section>
            <SuggestionModal
              open={openSuggestGraph}
              setOpen={setOpenSuggestGraph}
            />

            <UpgradeProModal open={open} setOpen={setOpen} />
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardPage;

function max(arr: number[]) {
  return arr.reduce((p, c) => (p > c ? p : c), 0);
}

export function formatNumberString(
  numString: string,
  minimumFractionDigits?: boolean,
) {
  const num = parseFloat(numString);
  if (minimumFractionDigits) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2 });
  } else {
    return num.toLocaleString("en-US");
  }
}
