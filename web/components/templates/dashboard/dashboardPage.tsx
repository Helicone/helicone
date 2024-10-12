import {
  ArrowPathIcon,
  ChartBarIcon,
  HomeIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/auth-helpers-nextjs";
import { AreaChart, BarChart, BarList, Card } from "@tremor/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { ModelMetric } from "../../../lib/api/models/models";
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
import { useDebounce } from "../../../services/hooks/debounce";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useOrganizationLayout } from "../../../services/hooks/organization_layout";
import {
  filterUITreeToFilterNode,
  getRootFilterNode,
  isFilterRowNode,
  UIFilterRowTree,
} from "../../../services/lib/filters/uiFilterRowTree";
import {
  OrganizationFilter,
  OrganizationLayout,
  transformFilter,
  transformOrganizationLayoutFilters,
} from "../../../services/lib/organization_layout/organization_layout";
import { useOrg } from "../../layout/organizationContext";
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
import { INITIAL_LAYOUT, SMALL_LAYOUT } from "./gridLayouts";
import CountryPanel from "./panels/countryPanel";
import { QuantilesGraph } from "./quantilesGraph";
import StyledAreaChart from "./styledAreaChart";
import SuggestionModal from "./suggestionsModal";
import { useDashboardPage } from "./useDashboardPage";
import { IslandContainer } from "@/components/ui/islandContainer";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardPageProps {
  user: User;
  currentFilter: OrganizationFilter | null;
  organizationLayout: OrganizationLayout | null;
}

export type TimeFilter = {
  start: Date;
  end: Date;
};

interface StatusCounts {
  [key: string]: number;
}

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

export type Loading<T> = T | "loading";

export type DashboardMode = "requests" | "costs" | "errors";

const DashboardPage = (props: DashboardPageProps) => {
  const { user, currentFilter, organizationLayout } = props;
  const initialLoadRef = useRef(true);

  const searchParams = useSearchParams();

  const orgContext = useOrg();

  const {
    organizationLayout: orgLayout,
    isLoading: isOrgLayoutLoading,
    refetch: orgLayoutRefetch,
    isRefetching: isOrgLayoutRefetching,
  } = useOrganizationLayout(
    orgContext?.currentOrg?.id!,
    "dashboard",
    organizationLayout
      ? {
          data: organizationLayout,
          error: null,
        }
      : undefined
  );

  const transformedFilters = useMemo(() => {
    if (orgLayout?.data?.filters) {
      return transformOrganizationLayoutFilters(orgLayout.data.filters);
    }
    return [];
  }, [orgLayout?.data?.filters]);

  const [currFilter, setCurrFilter] = useState<string | null>("");

  const getInterval = () => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

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
    getInterval() as TimeInterval
  );
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(getTimeFilter());

  const [open, setOpen] = useState(false);

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRowTree>(
    getRootFilterNode()
  );

  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

  const timeIncrement = getTimeInterval(timeFilter);

  const { unauthorized, currentTier } = useGetUnauthorized(user.id);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const encodeFilters = (filters: UIFilterRowTree): string => {
    const encode = (node: UIFilterRowTree): any => {
      if (isFilterRowNode(node)) {
        return {
          type: "node",
          operator: node.operator,
          rows: node.rows.map(encode),
        };
      } else {
        return {
          type: "leaf",
          filter: `${filterMap[node.filterMapIdx].label}:${
            filterMap[node.filterMapIdx].operators[node.operatorIdx].label
          }:${encodeURIComponent(node.value)}`,
        };
      }
    };

    return JSON.stringify(encode(filters));
  };

  const [isLive, setIsLive] = useLocalStorage("isLive-DashboardPage", false);

  const {
    metrics,
    filterMap,
    searchPropertyFilters,
    overTimeData,
    isAnyLoading,
    refetch,
    remove,
    models,
    isModelsLoading,
  } = useDashboardPage({
    timeFilter,
    uiFilters: debouncedAdvancedFilter,
    apiKeyFilter: null,
    timeZoneDifference: new Date().getTimezoneOffset(),
    dbIncrement: timeIncrement,
    isLive,
  });

  const getAdvancedFilters = useCallback((): UIFilterRowTree => {
    const decodeFilter = (encoded: any): UIFilterRowTree => {
      if (encoded.type === "node") {
        return {
          operator: encoded.operator as "and" | "or",
          rows: encoded.rows.map(decodeFilter),
        };
      } else {
        const [filterLabel, operator, value] = encoded.filter.split(":");
        const filterMapIdx = filterMap.findIndex(
          (f) =>
            f.label.trim().toLowerCase() === filterLabel.trim().toLowerCase()
        );
        const operatorIdx = filterMap[filterMapIdx]?.operators.findIndex(
          (o) => o.label.trim().toLowerCase() === operator.trim().toLowerCase()
        );

        if (
          isNaN(filterMapIdx) ||
          isNaN(operatorIdx) ||
          filterMapIdx === -1 ||
          operatorIdx === -1
        ) {
          console.log("Invalid filter map or operator index", {
            filterLabel,
            operator,
          });
          return getRootFilterNode();
        }

        return {
          filterMapIdx,
          operatorIdx,
          value: value,
        };
      }
    };

    try {
      const currentAdvancedFilters = searchParams.get("filters");

      if (currentAdvancedFilters) {
        const filters = decodeURIComponent(currentAdvancedFilters).replace(
          /^"|"$/g,
          ""
        );

        const parsedFilters = JSON.parse(filters);
        const result = decodeFilter(parsedFilters);
        return result;
      }
    } catch (error) {
      console.error("Error decoding advanced filters:", error);
    }

    return getRootFilterNode();
  }, [searchParams, filterMap]);

  useEffect(() => {
    if (initialLoadRef.current && filterMap.length > 0 && !isAnyLoading) {
      console.log("load");
      const loadedFilters = getAdvancedFilters();
      setAdvancedFilters(loadedFilters);
      initialLoadRef.current = false;
    }
  }, [filterMap, getAdvancedFilters]);

  const onSetAdvancedFiltersHandler = useCallback(
    (filters: UIFilterRowTree, layoutFilterId?: string | null) => {
      setAdvancedFilters(filters);
      if (
        layoutFilterId === null ||
        (isFilterRowNode(filters) && filters.rows.length === 0)
      ) {
        searchParams.delete("filters");
      } else {
        const currentAdvancedFilters = encodeFilters(filters);
        searchParams.set("filters", currentAdvancedFilters);
      }
    },
    [encodeFilters, refetch]
  );
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

  const modelMapper = (model: ModelMetric, index: number) => {
    // TODO add the filter to the advancedFilters
    return {
      name: model.model || "n/a",
      value: model.total_requests,
      color: listColors[index % listColors.length],
      // href: urlString,
      // target: "_self",
    };
  };

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

  const onLayoutFilterChange = (layoutFilter: OrganizationFilter | null) => {
    if (layoutFilter !== null) {
      const transformedFilter = transformFilter(layoutFilter.filter[0]);
      onSetAdvancedFiltersHandler(transformedFilter, layoutFilter.id);
      setCurrFilter(layoutFilter.id);
    } else {
      setCurrFilter(null);
      onSetAdvancedFiltersHandler({ operator: "and", rows: [] }, null);
    }
  };

  const renderUnauthorized = () => {
    if (currentTier === "free") {
      return (
        <div className="flex flex-col w-full h-[80vh] justify-center items-center">
          <div className="flex flex-col w-2/5">
            <HomeIcon className="h-12 w-12 text-black dark:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-black p-2 rounded-lg" />
            <p className="text-xl text-black dark:text-white font-semibold mt-8">
              You have reached your monthly limit.
            </p>
            <p className="text-sm text-slate-500 max-w-sm mt-2">
              Upgrade your plan to view your dashboard. Your requests are still
              being processed, but you will not be able to view them until you
              upgrade.
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  setOpen(true);
                }}
                className="items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (currentTier === "pro") {
      return (
        <div className="flex flex-col w-full h-[80vh] justify-center items-center">
          <div className="flex flex-col w-full">
            <HomeIcon className="h-12 w-12 text-black dark:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-black p-2 rounded-lg" />
            <p className="text-xl text-black dark:text-white font-semibold mt-8">
              You have reached your monthly limit on the Pro plan.
            </p>
            <p className="text-sm text-slate-500 max-w-sm mt-2">
              Please get in touch with us to discuss increasing your limits.
            </p>
            <div className="mt-4">
              <Link
                href="https://cal.com/team/helicone/helicone-discovery"
                target="_blank"
                rel="noreferrer"
                className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <IslandContainer>
        <AuthHeader
          isWithinIsland={true}
          title={"Dashboard"}
          headerActions={
            <button
              onClick={() => {
                remove();
                refetch();
              }}
              className="font-semibold text-black dark:text-white text-sm items-center flex flex-row hover:text-sky-700"
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
            <div>
              <ThemedSwitch
                checked={isLive}
                onChange={setIsLive}
                label="Live"
              />
            </div>
          }
        />
        {unauthorized ? (
          <>{renderUnauthorized()}</>
        ) : (
          <div className="space-y-4 mt-4">
            <ThemedTableHeader
              isFetching={isAnyLoading || isModelsLoading}
              timeFilter={{
                currentTimeFilter: timeFilter,
                customTimeFilter: true,
                timeFilterOptions: [],
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
                onAdvancedFilter: onSetAdvancedFiltersHandler,
                filters: advancedFilters,
                searchPropertyFilters: searchPropertyFilters,
              }}
              savedFilters={{
                currentFilter: currFilter ?? undefined,
                filters:
                  transformedFilters && orgLayout?.data?.id
                    ? transformedFilters
                    : undefined,
                onFilterChange: onLayoutFilterChange,
                onSaveFilterCallback: async () => {
                  await orgLayoutRefetch();
                },
                layoutPage: "dashboard",
              }}
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
                onLayoutChange={(currentLayout, allLayouts) => {}}
              >
                {metricsData.map((m, i) => (
                  <div key={m.id}>
                    <MetricsPanel metric={m} />
                  </div>
                ))}
                <div key="requests">
                  <Card className="border border-slate-200 bg-white text-slate-950 !shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 rounded-lg ring-0">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-slate-500 text-sm">Requests</p>
                        <p className="text-slate-950 dark:text-slate-50 text-xl font-semibold">
                          {metrics.totalRequests?.data?.data
                            ? `${formatNumberString(
                                metrics.totalRequests?.data?.data.toFixed(2)
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
                        <div className="h-full w-full bg-slate-200 dark:bg-slate-800 rounded-md pt-4">
                          <LoadingAnimation height={175} width={175} />
                        </div>
                      ) : (
                        <AreaChart
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
                  <Card className="h-full w-full flex flex-col border border-slate-200 bg-white text-slate-950 !shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 rounded-lg ring-0">
                    <div className="flex flex-col h-full">
                      <h2 className="text-slate-500 text-sm mb-2">
                        All Errors
                      </h2>
                      {(() => {
                        const totalErrors = accumulatedStatusCounts.reduce(
                          (sum, e) => sum + e.value,
                          0
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
                      <div className="flex-grow overflow-hidden flex flex-col">
                        <div className="flex flex-row justify-between items-center pb-2">
                          <p className="text-xs font-semibold text-slate-700">
                            Error Type
                          </p>
                          <p className="text-xs font-semibold text-slate-700">
                            Percentage
                          </p>
                        </div>
                        <div className="overflow-y-auto flex-grow">
                          <BarList
                            data={(() => {
                              const totalErrors =
                                accumulatedStatusCounts.reduce(
                                  (sum, e) => sum + e.value,
                                  0
                                );
                              return accumulatedStatusCounts
                                .sort((a, b) => b.value - a.value)
                                .map((error, index) => ({
                                  name: `${error.name} (${formatLargeNumber(
                                    error.value
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
                    <div className="flex flex-row justify-between items-center pb-2">
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
                          ?.map((model, index) => modelMapper(model, index))
                          .sort(
                            (a, b) =>
                              b.value - a.value - (b.name === "n/a" ? 1 : 0)
                          ) ?? []
                      }
                      className="overflow-auto h-full"
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
                            true
                          )}`
                        : "$0.00"
                    }
                    isDataOverTimeLoading={overTimeData.costs.isLoading}
                  >
                    <BarChart
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
                  <CountryPanel
                    timeFilter={timeFilter}
                    userFilters={filterUITreeToFilterNode(
                      filterMap,
                      debouncedAdvancedFilter
                    )}
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
                    <AreaChart
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
                    uiFilters={filterUITreeToFilterNode(
                      filterMap,
                      debouncedAdvancedFilter
                    )}
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
                    <AreaChart
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
                    <AreaChart
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
                  <div className="space-y-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 border-dashed w-full h-full p-2 text-slate-950 dark:text-slate-50 shadow-sm rounded-lg flex flex-col items-center justify-center">
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
                    <AreaChart
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
            </section>
          </div>
        )}
        <SuggestionModal
          open={openSuggestGraph}
          setOpen={setOpenSuggestGraph}
        />

        <UpgradeProModal open={open} setOpen={setOpen} />
      </IslandContainer>
    </>
  );
};

export default DashboardPage;
