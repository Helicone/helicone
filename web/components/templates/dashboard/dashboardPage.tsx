import { HeliconeUser } from "@/packages/common/auth/types";
import { TimeFilter } from "@/types/timeFilter";
import {
  ChartBarIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";
import { AreaChart as TremorAreaChart, BarChart, BarList } from "@tremor/react";
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
import { toFilterNode } from "@/filterAST/toFilterNode";
import {
  MetricsPanel,
  MetricsPanelProps,
} from "../../shared/metrics/metricsPanel";
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
import Header from "@/components/shared/Header";
import LivePill from "@/components/shared/LivePill";
import ThemedTimeFilter from "@/components/shared/themed/themedTimeFilter";
import FilterASTButton from "@/filterAST/FilterASTButton";
import { DollarSignIcon } from "lucide-react";
import RequestsOverTime from "./panels/RequestsOverTime";
import { cn } from "@/lib/utils";
import ErrorsCard from "./panels/ErrorsCard";
import ModelsCard from "./panels/ModelsCard";
import CostsCard from "./panels/CostsCard";
import UsersCard from "./panels/UsersCard";
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
  const filters = filterStore.filter ? toFilterNode(filterStore.filter) : "all";

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
    })()
  );
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(getTimeFilter());

  const [open, setOpen] = useState(false);

  const timeIncrement = useMemo(
    () => getTimeInterval(timeFilter),
    [timeFilter]
  );

  const mockOverTimeData = useMemo(
    () => getMockOverTimeData(timeIncrement),
    [timeIncrement]
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
    isAnyRefetching,
    models: realModels,
    isModelsLoading,
    isModelsRefetching,
    totalModels,
    isCountLoading,
    isCountRefetching,
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
              metrics.totalCost.data.data / metrics.totalRequests?.data?.data
            )}`
          : "$0.00",
      label: "Avg Cost / Req",
      icon: DollarSignIcon,
      isLoading: metrics.totalCost.isLoading || metrics.totalRequests.isLoading,
    },
    {
      id: "prompt-tokens",
      value:
        metrics.averageTokensPerRequest?.data?.data &&
        metrics.totalRequests?.data?.data
          ? formatLargeNumber(
              metrics.averageTokensPerRequest.data.data
                .average_prompt_tokens_per_response
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
                .average_completion_tokens_per_response
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
                .average_total_tokens_per_response
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
    getStatusCountsOverTime().overTime
  ).map(([time, counts]) => {
    return {
      date: getTimeMap(timeIncrement)(new Date(time)),
      success: counts.success,
      error: counts.error,
    };
  });

  const accumulatedStatusCounts = Object.entries(
    getStatusCountsOverTime().accStatusCounts
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

  const onTimeSelectHandler = (key: TimeInterval, value: string) => {
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
  };

  return (
    <>
      <div>
        {!shouldShowMockData && (
          <Header
            className="border-b-0"
            title={"Dashboard"}
            leftActions={
              <div className="flex flex-row items-center gap-2">
                <ThemedTimeFilter
                  timeFilterOptions={[]}
                  isFetching={isAnyLoading || isModelsLoading}
                  onSelect={(key: string, value: string) =>
                    onTimeSelectHandler(key as TimeInterval, value)
                  }
                  defaultValue={interval ?? "all"}
                  currentTimeFilter={timeFilter}
                  custom={true}
                />
                <FilterASTButton />
              </div>
            }
            rightActions={
              <div>
                <LivePill
                  isLive={isLive}
                  setIsLive={setIsLive}
                  isDataLoading={isAnyLoading || isModelsLoading}
                  isRefetching={isAnyRefetching || isModelsRefetching}
                  refetch={refetch}
                />
              </div>
            }
          />
        )}
        {unauthorized ? (
          <UnauthorizedView currentTier={currentTier || ""} />
        ) : (
          <div
            className={cn(
              shouldShowMockData ? "pt-6" : "px-4 pt-2",
              "bg-slate-100 dark:bg-slate-900"
            )}
          >
            <section id="panels" className="">
              <ResponsiveGridLayout
                className="layout"
                layouts={{
                  lg: INITIAL_LAYOUT,
                  md: INITIAL_LAYOUT,
                  sm: INITIAL_LAYOUT,
                  xs: SMALL_LAYOUT,
                  xxs: SMALL_LAYOUT,
                }}
                // autoSize={true}
                // isBounded={true}
                isDraggable={false}
                breakpoints={{ lg: 1200, md: 996, sm: 600, xs: 360, xxs: 0 }}
                cols={gridCols}
                rowHeight={96}
                // margin={[0, 0]}
                containerPadding={[0, 0]}
              >
                {metricsData.map((m, i) => (
                  <div key={m.id}>
                    <MetricsPanel metric={m} />
                  </div>
                ))}
                <div key="requests">
                  <RequestsOverTime
                    isLoading={overTimeData.requests.isLoading}
                    flattenedOverTime={flattenedOverTime}
                    requestsOverTime={
                      metrics.totalRequests?.data?.data
                        ? `${formatNumberString(
                            metrics.totalRequests?.data?.data.toFixed(2)
                          )}`
                        : "0"
                    }
                  />
                </div>
                <div key="errors">
                  <ErrorsCard
                    isLoading={overTimeData.requestsWithStatus.isLoading}
                    data={accumulatedStatusCounts}
                    totalErrors={accumulatedStatusCounts.reduce(
                      (sum, e) => sum + e.value,
                      0
                    )}
                    errorPercentage={
                      (accumulatedStatusCounts.reduce(
                        (sum, e) => sum + e.value,
                        0
                      ) /
                        (metrics.totalRequests?.data?.data ?? 1)) *
                        100 || 0
                    }
                  />
                </div>

                <div key="models">
                  <ModelsCard
                    isLoading={isModelsLoading || isCountLoading}
                    models={
                      models?.data
                        ?.map((model) => ({
                          name: model.model || "n/a",
                          value: model.total_requests,
                        }))
                        .sort(
                          (a, b) =>
                            b.value - a.value - (b.name === "n/a" ? 1 : 0)
                        ) ?? []
                    }
                    totalModels={totalModels}
                    isRefetching={isModelsRefetching || isCountRefetching}
                  />
                </div>
                <div key="costs">
                  <CostsCard
                    totalCost={
                      metrics.totalCost.data?.data
                        ? `$${formatNumberString(
                            metrics.totalCost.data?.data < 0.02
                              ? metrics.totalCost.data?.data.toFixed(7)
                              : metrics.totalCost.data?.data.toFixed(2),
                            true
                          )}`
                        : "$0.00"
                    }
                    isLoading={overTimeData.costs.isLoading}
                    data={
                      overTimeData.costs.data?.data?.map((r) => ({
                        date: getTimeMap(timeIncrement)(r.time),
                        cost: r.cost,
                      })) ?? []
                    }
                  />
                </div>
                <div key="users">
                  <UsersCard
                    totalUsers={
                      metrics.activeUsers.data?.data
                        ? formatLargeNumber(metrics.activeUsers.data?.data)
                        : "0"
                    }
                    isLoading={overTimeData.users.isLoading}
                    data={
                      overTimeData.users.data?.data?.map((r) => ({
                        date: getTimeMap(timeIncrement)(r.time),
                        users: r.count,
                      })) ?? []
                    }
                  />
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
                      (metrics.averageLatency.data?.data ?? 0) / 1000
                    )} s / req`}
                    isDataOverTimeLoading={overTimeData.latency.isLoading}
                  >
                    <TremorAreaChart
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
                          Number(number) / 1000
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
                      metrics.averageTimeToFirstToken.data?.data ?? 0
                    )} ms`}
                    isDataOverTimeLoading={
                      overTimeData.timeToFirstToken.isLoading
                    }
                  >
                    <TremorAreaChart
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
                          number
                        )} ms`;
                      }}
                    />
                  </StyledAreaChart>
                </div>
                <div key="threats">
                  <StyledAreaChart
                    title={"Threats"}
                    value={`${formatLargeNumber(
                      Number(metrics.totalThreats.data?.data?.toFixed(0) ?? 0)
                    )}`}
                    isDataOverTimeLoading={overTimeData.threats.isLoading}
                  >
                    <TremorAreaChart
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
                  <div className="space-y-2 bg-white dark:bg-black border-noneborder-slate-200 dark:border-slate-900 border-dashed w-full h-full p-2 text-slate-950 dark:text-slate-50 shadow-sm flex flex-col items-center justify-center">
                    <PresentationChartLineIcon className="h-12 w-12 text-black dark:text-white" />
                    <button
                      className="p-4 text-semibold text-lg"
                      onClick={() => {
                        setOpenSuggestGraph(true);
                      }}
                    >
                      Request a new graph
                    </button>
                    <div className="text-sm text-slate-500 text-center max-w-xs">
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
                          .filter((d) => d !== 0) ?? []
                      ) /
                        Number(getIncrementAsMinutes(timeIncrement).toFixed(2))
                    )} tokens`}
                    isDataOverTimeLoading={overTimeData.users.isLoading}
                  >
                    <TremorAreaChart
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
                          })
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
  minimumFractionDigits?: boolean
) {
  const num = parseFloat(numString);
  if (minimumFractionDigits) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2 });
  } else {
    return num.toLocaleString("en-US");
  }
}
