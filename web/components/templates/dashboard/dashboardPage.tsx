import { HeliconeUser } from "@/packages/common/auth/types";
import { TimeFilter } from "@/types/timeFilter";
import {
  ChartBarIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
import Header from "../../shared/Header";
import LivePill from "../../shared/LivePill";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import FilterASTButton from "@/filterAST/FilterASTButton";
import LoadingAnimation from "../../shared/loadingAnimation";
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

// Gateway discount configuration
const GATEWAY_DISCOUNT_MIN = 0.1; // 10%
const GATEWAY_DISCOUNT_MAX = 0.2; // 20%
const CALENDLY_URL = "https://cal.com/cole-gottdank/inference-discount";
import {
  getMockMetrics,
  getMockModels,
  getMockOverTimeData,
} from "./mockDashboardData";
import CountryPanel from "./panels/countryPanel";
import { ScoresPanel } from "./panels/scores/scoresPanel";
import ModelsPanel from "./panels/modelsPanel";
import ModelsByCostPanel from "./panels/modelsByCostPanel";
import TopProvidersPanel from "./panels/topProvidersPanel";
import ErrorsPanel from "./panels/errorsPanel";
import { QuantilesGraph } from "./quantilesGraph";
import SuggestionModal from "./suggestionsModal";
import { useDashboardPage } from "./useDashboardPage";
import { CHART_COLORS } from "../../../lib/chartColors";
import DashboardExportButton from "./DashboardExportButton";
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
  // Get the default time filter from org settings, fallback to "7d"
  const defaultTimeFilter = (orgContext?.currentOrg?.default_time_filter ?? "7d") as TimeInterval;

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
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || defaultTimeFilter),
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
        return currentTimeFilter || defaultTimeFilter;
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

  // Update time filter when org's default changes and no URL param is set
  useEffect(() => {
    const currentTimeFilter = searchParams.get("t");
    if (!currentTimeFilter && orgContext?.currentOrg?.default_time_filter) {
      const newDefaultInterval = orgContext.currentOrg.default_time_filter as TimeInterval;
      setInterval(newDefaultInterval);
      setTimeFilter({
        start: getTimeIntervalAgo(newDefaultInterval),
        end: new Date(),
      });
    }
  }, [orgContext?.currentOrg?.default_time_filter]);

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
    providers: realProviders,
    isProvidersLoading,
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
    : {
        data:
          realModels.error === null
            ? (realModels.data ?? undefined)
            : undefined,
        isLoading: isModelsLoading,
      };
  const providers = shouldShowMockData
    ? { data: [], isLoading: false }
    : {
        data:
          realProviders.error === null
            ? (realProviders.data ?? undefined)
            : undefined,
        isLoading: isProvidersLoading,
      };

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
  const [gatewayDiscountDismissed, setGatewayDiscountDismissed] =
    useState(false);

  return (
    <>
      <div className="flex h-screen w-full flex-col overflow-x-hidden">
        {!shouldShowMockData && (
          <Header
            title="Dashboard"
            leftActions={
              <div className="flex flex-row items-center gap-2">
                {/* Time Filter */}
                <ThemedTimeFilter
                  currentTimeFilter={timeFilter}
                  timeFilterOptions={[]}
                  onSelect={function (key: string, value: string): void {
                    if (key === "custom") {
                      const [start, end] = value.split("_");
                      setInterval("custom" as TimeInterval);
                      setTimeFilter({
                        start: new Date(start),
                        end: new Date(end),
                      });
                    } else {
                      setInterval(key as TimeInterval);
                      setTimeFilter({
                        start: getTimeIntervalAgo(key as TimeInterval),
                        end: new Date(),
                      });
                    }
                  }}
                  isFetching={isAnyLoading || isModelsLoading}
                  defaultValue={interval}
                  custom={true}
                  isLive={isLive}
                  hasCustomTimeFilter={
                    searchParams.get("t")?.startsWith("custom_") || false
                  }
                  onClearTimeFilter={() => {
                    searchParams.delete("t");
                    setInterval("1m");
                    setTimeFilter({
                      start: getTimeIntervalAgo("1m"),
                      end: new Date(),
                    });
                  }}
                />

                {/* Filter AST Button */}
                <FilterASTButton />
              </div>
            }
            rightActions={
              <div className="flex items-center gap-2">
                {/* Export button */}
                {!shouldShowMockData && (
                  <DashboardExportButton
                    data={{
                      metrics,
                      overTimeData,
                      models: realModels,
                      providers: realProviders,
                    }}
                    timeFilter={timeFilter}
                    disabled={isAnyLoading}
                  />
                )}
                {/* Live pill */}
                <LivePill
                  isLive={isLive}
                  setIsLive={setIsLive}
                  isDataLoading={isAnyLoading}
                  isRefetching={isModelsLoading || isProvidersLoading}
                  refetch={refetch}
                />
              </div>
            }
          />
        )}
        {unauthorized ? (
          <UnauthorizedView currentTier={currentTier || ""} />
        ) : (
          <div className={`${shouldShowMockData ? "pt-6" : ""}`}>
            <section id="panels">
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
                isResizable={false}
                compactType={null}
                preventCollision={true}
                breakpoints={{ lg: 1200, md: 996, sm: 600, xs: 360, xxs: 0 }}
                cols={gridCols}
                rowHeight={96}
                margin={[0, 0]}
              >
                {metricsData.map((m) => (
                  <div key={m.id}>
                    <MetricsPanel metric={m} />
                  </div>
                ))}
                <div key="requests">
                  <div className="flex h-full flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm text-muted-foreground">
                          Requests
                        </p>
                        <p className="text-xl font-semibold text-foreground">
                          {metrics.totalRequests?.data?.data
                            ? `${formatNumberString(
                                metrics.totalRequests?.data?.data.toFixed(2),
                              )}`
                            : "0"}
                        </p>
                      </div>
                    </div>

                    <div className="w-full pt-4">
                      {overTimeData.requests.isLoading ? (
                        <div className="flex h-[180px] w-full items-center justify-center bg-muted">
                          <LoadingAnimation height={175} width={175} />
                        </div>
                      ) : (
                        <ChartContainer
                          config={{
                            success: {
                              label: "Success",
                              color: CHART_COLORS.success,
                            },
                            error: {
                              label: "Error",
                              color: CHART_COLORS.error,
                            },
                          }}
                          className="h-[180px] w-full"
                        >
                          <AreaChart data={flattenedOverTime}>
                            <defs>
                              <linearGradient
                                id="fillSuccess"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-success)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-success)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                              <linearGradient
                                id="fillError"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-error)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-error)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              minTickGap={50}
                            />
                            <YAxis domain={[0, "auto"]} hide />
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Area
                              dataKey="success"
                              type="monotone"
                              fill="url(#fillSuccess)"
                              stroke="var(--color-success)"
                            />
                            <Area
                              dataKey="error"
                              type="monotone"
                              fill="url(#fillError)"
                              stroke="var(--color-error)"
                            />
                          </AreaChart>
                        </ChartContainer>
                      )}
                    </div>
                  </div>
                </div>
                <div key="errors">
                  <ErrorsPanel
                    accumulatedStatusCounts={accumulatedStatusCounts}
                    totalRequests={metrics.totalRequests?.data?.data ?? 1}
                  />
                </div>
                <div key="models">
                  <ModelsPanel models={models} />
                </div>
                <div key="models-by-cost">
                  <ModelsByCostPanel models={models} />
                </div>
                <div key="top-providers">
                  <TopProvidersPanel providers={providers} />
                </div>
                <div key="costs">
                  <div className="flex h-full flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm text-muted-foreground">Costs</p>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xl font-semibold text-foreground">
                            {metrics.totalCost.data?.data
                              ? `$${formatNumberString(
                                  metrics.totalCost.data?.data < 0.02
                                    ? metrics.totalCost.data?.data.toFixed(7)
                                    : metrics.totalCost.data?.data.toFixed(2),
                                  true,
                                )}`
                              : "$0.00"}
                          </p>
                          {orgContext?.currentOrg?.gateway_discount_enabled &&
                            metrics.totalCost.data?.data &&
                            !gatewayDiscountDismissed &&
                            !sessionStorage.getItem(
                              "gateway-discount-dismissed",
                            ) && (
                              <div className="group flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    window.open(
                                      CALENDLY_URL,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                  className="group/button flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 transition-all hover:text-primary hover:underline"
                                >
                                  <span>
                                    save{" "}
                                    <span className="text-confirmative group-hover/button:text-primary">
                                      $
                                      {formatNumberString(
                                        (
                                          metrics.totalCost.data.data *
                                          GATEWAY_DISCOUNT_MAX
                                        ).toFixed(2),
                                      )}
                                      /mo
                                    </span>{" "}
                                    w/ AI Gateway
                                  </span>
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="transition-transform group-hover/button:translate-x-0.5"
                                  >
                                    <path
                                      d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                                      fill="currentColor"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    sessionStorage.setItem(
                                      "gateway-discount-dismissed",
                                      "true",
                                    );
                                    setGatewayDiscountDismissed(true);
                                  }}
                                  className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                                  aria-label="Dismiss"
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                                      fill="currentColor"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full pt-4">
                      {overTimeData.costs.isLoading ? (
                        <div className="flex h-[180px] w-full items-center justify-center bg-muted">
                          <LoadingAnimation height={175} width={175} />
                        </div>
                      ) : (
                        <ChartContainer
                          config={{
                            costs: {
                              label: "Costs",
                              color: CHART_COLORS.blue,
                            },
                          }}
                          className="h-[180px] w-full"
                        >
                          <BarChart
                            data={
                              overTimeData.costs.data?.data?.map((r) => ({
                                date: getTimeMap(timeIncrement)(r.time),
                                costs: r.cost,
                              })) ?? []
                            }
                          >
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              minTickGap={50}
                            />
                            <YAxis domain={[0, "auto"]} hide />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  indicator="dot"
                                  valueFormatter={(value) =>
                                    `$${new Intl.NumberFormat("us").format(Number(value))}`
                                  }
                                />
                              }
                            />
                            <Bar
                              dataKey="costs"
                              fill="var(--color-costs)"
                              radius={0}
                            />
                          </BarChart>
                        </ChartContainer>
                      )}
                    </div>
                  </div>
                </div>
                <div key="users">
                  <div className="flex h-full flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm text-muted-foreground">Users</p>
                        <p className="text-xl font-semibold text-foreground">
                          {metrics.activeUsers.data?.data
                            ? formatLargeNumber(metrics.activeUsers.data?.data)
                            : "0"}
                        </p>
                      </div>
                    </div>

                    <div className="w-full pt-4">
                      {overTimeData.users.isLoading ? (
                        <div className="flex h-[180px] w-full items-center justify-center bg-muted">
                          <LoadingAnimation height={175} width={175} />
                        </div>
                      ) : (
                        <ChartContainer
                          config={{
                            users: {
                              label: "Users",
                              color: CHART_COLORS.orange,
                            },
                          }}
                          className="h-[180px] w-full"
                        >
                          <BarChart
                            data={
                              overTimeData.users.data?.data?.map((r) => ({
                                date: getTimeMap(timeIncrement)(r.time),
                                users: r.count,
                              })) ?? []
                            }
                          >
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              minTickGap={50}
                            />
                            <YAxis domain={[0, "auto"]} hide />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  indicator="dot"
                                  valueFormatter={(value) =>
                                    new Intl.NumberFormat("us").format(
                                      Number(value),
                                    )
                                  }
                                />
                              }
                            />
                            <Bar
                              dataKey="users"
                              fill="var(--color-users)"
                              radius={0}
                            />
                          </BarChart>
                        </ChartContainer>
                      )}
                    </div>
                  </div>
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
                  <div className="flex h-full flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm text-muted-foreground">Latency</p>
                        <p className="text-xl font-semibold text-foreground">
                          {`${new Intl.NumberFormat("us").format(
                            (metrics.averageLatency.data?.data ?? 0) / 1000,
                          )} s / req`}
                        </p>
                      </div>
                    </div>

                    <div className="w-full pt-4">
                      {overTimeData.latency.isLoading ? (
                        <div className="flex h-[180px] w-full items-center justify-center bg-muted">
                          <LoadingAnimation height={175} width={175} />
                        </div>
                      ) : (
                        <ChartContainer
                          config={{
                            latency: {
                              label: "Latency",
                              color: CHART_COLORS.cyan,
                            },
                          }}
                          className="h-[180px] w-full"
                        >
                          <AreaChart
                            data={
                              overTimeData.latency.data?.data?.map((r) => ({
                                date: getTimeMap(timeIncrement)(r.time),
                                latency: r.duration / 1000,
                              })) ?? []
                            }
                          >
                            <defs>
                              <linearGradient
                                id="fillLatency"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-latency)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-latency)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              minTickGap={50}
                            />
                            <YAxis domain={[0, "auto"]} hide />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  indicator="dot"
                                  valueFormatter={(value) =>
                                    `${new Intl.NumberFormat("us").format(Number(value))} s`
                                  }
                                />
                              }
                            />
                            <Area
                              dataKey="latency"
                              type="monotone"
                              fill="url(#fillLatency)"
                              stroke="var(--color-latency)"
                            />
                          </AreaChart>
                        </ChartContainer>
                      )}
                    </div>
                  </div>
                </div>
                <div key="quantiles">
                  <QuantilesGraph
                    filters={filters}
                    timeFilter={timeFilter}
                    timeIncrement={timeIncrement}
                  />
                </div>
                <div key="time-to-first-token">
                  <div className="flex h-full flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm text-muted-foreground">
                          Time to First Token
                        </p>
                        <p className="text-xl font-semibold text-foreground">
                          {`Average: ${new Intl.NumberFormat("us").format(
                            metrics.averageTimeToFirstToken.data?.data ?? 0,
                          )} ms`}
                        </p>
                      </div>
                    </div>

                    <div className="w-full pt-4">
                      {overTimeData.timeToFirstToken.isLoading ? (
                        <div className="flex h-[180px] w-full items-center justify-center bg-muted">
                          <LoadingAnimation height={175} width={175} />
                        </div>
                      ) : (
                        <ChartContainer
                          config={{
                            ttft: {
                              label: "Time to First Token",
                              color: CHART_COLORS.purple,
                            },
                          }}
                          className="h-[180px] w-full"
                        >
                          <AreaChart
                            data={
                              overTimeData.timeToFirstToken.data?.data?.map(
                                (r) => ({
                                  date: getTimeMap(timeIncrement)(r.time),
                                  ttft: r.ttft,
                                }),
                              ) ?? []
                            }
                          >
                            <defs>
                              <linearGradient
                                id="fillTTFT"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-ttft)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-ttft)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              minTickGap={50}
                            />
                            <YAxis domain={[0, "auto"]} hide />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  indicator="dot"
                                  valueFormatter={(value) =>
                                    `${new Intl.NumberFormat("us").format(Number(value))} ms`
                                  }
                                />
                              }
                            />
                            <Area
                              dataKey="ttft"
                              type="monotone"
                              fill="url(#fillTTFT)"
                              stroke="var(--color-ttft)"
                            />
                          </AreaChart>
                        </ChartContainer>
                      )}
                    </div>
                  </div>
                </div>
                <div key="threats">
                  <div className="flex h-full flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm text-muted-foreground">Threats</p>
                        <p className="text-xl font-semibold text-foreground">
                          {formatLargeNumber(
                            Number(
                              metrics.totalThreats.data?.data?.toFixed(0) ?? 0,
                            ),
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="w-full pt-4">
                      {overTimeData.threats.isLoading ? (
                        <div className="flex h-[180px] w-full items-center justify-center bg-muted">
                          <LoadingAnimation height={175} width={175} />
                        </div>
                      ) : (
                        <ChartContainer
                          config={{
                            threats: {
                              label: "Threats",
                              color: CHART_COLORS.yellow,
                            },
                          }}
                          className="h-[180px] w-full"
                        >
                          <AreaChart
                            data={
                              overTimeData.threats.data?.data?.map((r) => ({
                                date: getTimeMap(timeIncrement)(r.time),
                                threats: r.count,
                              })) ?? []
                            }
                          >
                            <defs>
                              <linearGradient
                                id="fillThreats"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-threats)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-threats)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              minTickGap={50}
                            />
                            <YAxis domain={[0, "auto"]} hide />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  indicator="dot"
                                  valueFormatter={(value) =>
                                    new Intl.NumberFormat("us").format(
                                      Number(value),
                                    )
                                  }
                                />
                              }
                            />
                            <Area
                              dataKey="threats"
                              type="monotone"
                              fill="url(#fillThreats)"
                              stroke="var(--color-threats)"
                            />
                          </AreaChart>
                        </ChartContainer>
                      )}
                    </div>
                  </div>
                </div>
                <div key="suggest-more-graphs">
                  <div className="flex h-full w-full flex-col items-center justify-center space-y-2 border-b border-r border-border bg-card p-6 text-card-foreground">
                    <PresentationChartLineIcon className="h-12 w-12 text-foreground" />
                    <button
                      className="text-semibold p-4 text-lg"
                      onClick={() => {
                        setOpenSuggestGraph(true);
                      }}
                    >
                      Request a new graph
                    </button>
                    <div className="max-w-xs text-center text-sm text-muted-foreground">
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
                  <div className="flex h-full flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm text-muted-foreground">
                          Tokens / Minute
                        </p>
                        <p className="text-xl font-semibold text-foreground">
                          {`Max: ${formatLargeNumber(
                            max(
                              overTimeData.promptTokensOverTime.data?.data
                                ?.map(
                                  (d) => d.completion_tokens + d.prompt_tokens,
                                )
                                .filter((d) => d !== 0) ?? [],
                            ) /
                              Number(
                                getIncrementAsMinutes(timeIncrement).toFixed(2),
                              ),
                          )} tokens`}
                        </p>
                      </div>
                    </div>

                    <div className="w-full pt-4">
                      {overTimeData.users.isLoading ? (
                        <div className="flex h-[180px] w-full items-center justify-center bg-muted">
                          <LoadingAnimation height={175} width={175} />
                        </div>
                      ) : (
                        <ChartContainer
                          config={{
                            promptPerMin: {
                              label: "Prompt / min",
                              color: CHART_COLORS.blue,
                            },
                            completionPerMin: {
                              label: "Completion / min",
                              color: CHART_COLORS.purple,
                            },
                            totalPerMin: {
                              label: "Total / min",
                              color: CHART_COLORS.orange,
                            },
                          }}
                          className="h-[180px] w-full"
                        >
                          <AreaChart
                            data={
                              overTimeData.promptTokensOverTime.data?.data?.map(
                                (r) => ({
                                  date: getTimeMap(timeIncrement)(r.time),
                                  promptPerMin:
                                    (r.prompt_tokens + 0.0) /
                                    getIncrementAsMinutes(timeIncrement),
                                  completionPerMin:
                                    (r.completion_tokens + 0.0) /
                                    getIncrementAsMinutes(timeIncrement),
                                  totalPerMin:
                                    (r.prompt_tokens +
                                      r.completion_tokens +
                                      0.0) /
                                    getIncrementAsMinutes(timeIncrement),
                                }),
                              ) ?? []
                            }
                          >
                            <defs>
                              <linearGradient
                                id="fillPromptPerMin"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-promptPerMin)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-promptPerMin)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                              <linearGradient
                                id="fillCompletionPerMin"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-completionPerMin)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-completionPerMin)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                              <linearGradient
                                id="fillTotalPerMin"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-totalPerMin)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-totalPerMin)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              minTickGap={50}
                            />
                            <YAxis domain={[0, "auto"]} hide />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  indicator="dot"
                                  valueFormatter={(value) =>
                                    `${new Intl.NumberFormat("us").format(Number(value))} tokens`
                                  }
                                />
                              }
                            />
                            <Area
                              dataKey="promptPerMin"
                              type="monotone"
                              fill="url(#fillPromptPerMin)"
                              stroke="var(--color-promptPerMin)"
                            />
                            <Area
                              dataKey="completionPerMin"
                              type="monotone"
                              fill="url(#fillCompletionPerMin)"
                              stroke="var(--color-completionPerMin)"
                            />
                            <Area
                              dataKey="totalPerMin"
                              type="monotone"
                              fill="url(#fillTotalPerMin)"
                              stroke="var(--color-totalPerMin)"
                            />
                          </AreaChart>
                        </ChartContainer>
                      )}
                    </div>
                  </div>
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
