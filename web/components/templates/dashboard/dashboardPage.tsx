import { ArrowPathIcon, ChartBarIcon } from "@heroicons/react/24/outline";
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
import {
  MetricsPanel,
  MetricsPanelProps,
} from "../../shared/metrics/metricsPanel";
import { useDashboardPage } from "./useDashboardPage";
import { useGetAuthorized } from "../../../services/hooks/dashboard";
import { User } from "@supabase/auth-helpers-nextjs";
import UpgradeProModal from "../../shared/upgradeProModal";
import useSearchParams from "../../shared/utils/useSearchParams";
import { Responsive, WidthProvider } from "react-grid-layout";
import StyledAreaChart from "./styledAreaChart";
import { AreaChart, BarChart, BarList, Card } from "@tremor/react";
import LoadingAnimation from "../../shared/loadingAnimation";
import { formatNumber } from "../users/initialColumns";
import { useQuery } from "@tanstack/react-query";
import { Result } from "../../../lib/shared/result";
import { ModelMetric } from "../../../lib/api/models/models";
import { MultiSelect, MultiSelectItem } from "@tremor/react";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardPageProps {
  user: User;
}

export type TimeFilter = {
  start: Date;
  end: Date;
};

interface StatusCounts {
  [key: string]: number;
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
  const { user } = props;
  const searchParams = useSearchParams();

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
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "24h"),
        end: new Date(),
      };
    }
    return range;
  };

  const getAdvancedFilters = (): UIFilterRow[] => {
    try {
      const currentAdvancedFilters = searchParams.get("filters");

      if (currentAdvancedFilters) {
        const filters = decodeURIComponent(currentAdvancedFilters).slice(2, -2);
        const decodedFilters = filters
          .split("|")
          .map(decodeFilter)
          .filter((filter) => filter !== null) as UIFilterRow[];

        return decodedFilters;
      }
    } catch (error) {
      console.error("Error decoding advanced filters:", error);
    }
    return [];
  };

  const [interval, setInterval] = useState<TimeInterval>(
    getInterval() as TimeInterval
  );
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(getTimeFilter());

  const [open, setOpen] = useState(false);

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>(
    getAdvancedFilters()
  );

  const debouncedAdvancedFilters = useDebounce(advancedFilters, 500);

  const timeIncrement = getTimeInterval(timeFilter);

  const { authorized } = useGetAuthorized(user.id);

  const { metrics, filterMap, overTimeData, isAnyLoading } = useDashboardPage({
    timeFilter,
    uiFilters: debouncedAdvancedFilters,
    apiKeyFilter: null,
    timeZoneDifference: new Date().getTimezoneOffset(),
    dbIncrement: timeIncrement,
  });

  const { data: models, isLoading } = useQuery({
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
          limit: 5,
          timeFilter,
        }),
      }).then((res) => res.json() as Promise<Result<ModelMetric[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  function encodeFilter(filter: UIFilterRow): string {
    return `${filter.filterMapIdx}:${filter.operatorIdx}:${encodeURIComponent(
      filter.value
    )}`;
  }

  function decodeFilter(encoded: string): UIFilterRow | null {
    try {
      const parts = encoded.split(":");
      if (parts.length !== 3) return null;
      const filterMapIdx = parseInt(parts[0], 10);
      const operatorIdx = parseInt(parts[1], 10);
      const value = decodeURIComponent(parts[2]);

      if (isNaN(filterMapIdx) || isNaN(operatorIdx)) return null;

      return { filterMapIdx, operatorIdx, value };
    } catch (error) {
      console.error("Error decoding filter:", error);
      return null;
    }
  }

  const onSetAdvancedFilters = (filters: UIFilterRow[]) => {
    if (filters.length > 0) {
      const currentAdvancedFilters = encodeURIComponent(
        JSON.stringify(filters.map(encodeFilter).join("|"))
      );
      searchParams.set("filters", JSON.stringify(currentAdvancedFilters));
    } else {
      searchParams.delete("filters");
    }

    setAdvancedFilters(filters);
  };

  const metricsData: MetricsPanelProps["metric"][] = [
    {
      id: "cost-req",
      value:
        metrics.totalCost.data?.data && metrics.totalRequests?.data?.data
          ? `$${formatNumber(
              metrics.totalCost.data.data / metrics.totalRequests?.data?.data,
              6
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
          ? `${metrics.averageTokensPerRequest.data.data.average_prompt_tokens_per_response.toFixed(
              2
            )}`
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
          ? `${metrics.averageTokensPerRequest.data.data.average_completion_tokens_per_response.toFixed(
              2
            )}`
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
          ? `${metrics.averageTokensPerRequest.data.data.average_total_tokens_per_response.toFixed(
              2
            )}`
          : "n/a",
      label: "Avg Total Tokens / Req",
      icon: ChartBarIcon,
      isLoading:
        metrics.averageTokensPerRequest.isLoading ||
        metrics.totalRequests.isLoading,
    },
  ];

  const initialLayout: ReactGridLayout.Layout[] = [
    {
      i: "requests",
      x: 0,
      y: 0,
      w: 8,
      h: 4,
      minW: 4,
      maxW: 12,
      minH: 4,
      maxH: 8,
    },
    {
      i: "cost-req",
      x: 8,
      y: 0,
      w: 2,
      h: 2,
      minW: 2,
      maxW: 4,
      minH: 1,
      maxH: 4,
    },
    {
      i: "prompt-tokens",
      x: 10,
      y: 0,
      w: 2,
      h: 2,
      minW: 2,
      maxW: 4,
      minH: 1,
      maxH: 4,
    },
    {
      i: "completion-tokens",
      x: 8,
      y: 3,
      w: 2,
      h: 2,
      minW: 2,
      maxW: 4,
      minH: 1,
      maxH: 4,
    },
    {
      i: "total-tokens",
      x: 10,
      y: 3,
      w: 2,
      h: 2,
      minW: 2,
      maxW: 4,
      minH: 1,
      maxH: 4,
    },
    {
      i: "models",
      x: 0,
      y: 4,
      w: 3,
      h: 4,
      minW: 3,
      maxW: 8,
      minH: 4,
      maxH: 4,
    },
    { i: "costs", x: 3, y: 4, w: 3, h: 4, minW: 3, maxW: 8, minH: 4, maxH: 4 },
    { i: "users", x: 6, y: 4, w: 3, h: 4, minW: 3, maxW: 8, minH: 4, maxH: 4 },

    {
      i: "latency",
      x: 9,
      y: 4,
      w: 3,
      h: 4,
      minW: 3,
      maxW: 8,
      minH: 4,
      maxH: 4,
    },
  ];

  const smallLayout: ReactGridLayout.Layout[] = [
    {
      i: "requests",
      x: 0,
      y: 0,
      w: 4,
      h: 4,
      minW: 4,
      maxW: 12,
      minH: 4,
      maxH: 8,
      static: true,
    },
    {
      i: "cost-req",
      x: 0,
      y: 4,
      w: 2,
      h: 2,
      minW: 2,
      maxW: 4,
      minH: 1,
      maxH: 4,
      static: true,
    },
    {
      i: "prompt-tokens",
      x: 2,
      y: 4,
      w: 2,
      h: 2,
      minW: 2,
      maxW: 4,
      minH: 1,
      maxH: 4,
      static: true,
    },
    {
      i: "completion-tokens",
      x: 0,
      y: 6,
      w: 2,
      h: 2,
      minW: 2,
      maxW: 4,
      minH: 1,
      maxH: 4,
      static: true,
    },
    {
      i: "total-tokens",
      x: 2,
      y: 6,
      w: 2,
      h: 2,
      minW: 2,
      maxW: 4,
      minH: 1,
      maxH: 4,
      static: true,
    },
    {
      i: "models",
      x: 0,
      y: 8,
      w: 4,
      h: 4,
      minW: 3,
      maxW: 8,
      minH: 4,
      maxH: 4,
      static: true,
    },
    {
      i: "costs",
      x: 0,
      y: 12,
      w: 4,
      h: 4,
      minW: 3,
      maxW: 8,
      minH: 4,
      maxH: 4,
      static: true,
    },
    {
      i: "users",
      x: 0,
      y: 16,
      w: 4,
      h: 4,
      minW: 3,
      maxW: 8,
      minH: 4,
      maxH: 4,
      static: true,
    },
    {
      i: "latency",
      x: 0,
      y: 20,
      w: 4,
      h: 4,
      minW: 3,
      maxW: 8,
      minH: 4,
      maxH: 4,
      static: true,
    },
  ];

  const gridCols = { lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 };

  const modelColors = ["purple", "blue", "green", "yellow", "orange"];

  const modelMapper = (model: ModelMetric, index: number) => {
    const currentAdvancedFilters = encodeURIComponent(
      JSON.stringify(
        [
          {
            filterMapIdx: 0,
            operatorIdx: 0,
            value: model.model,
          },
        ]
          .map(encodeFilter)
          .join("|")
      )
    );

    const url = new URL("/dashboard", window.location.origin);

    const params = new URLSearchParams(window.location.search);

    params.set("filters", `"${currentAdvancedFilters}"`);

    url.search = params.toString();

    const urlString = url.toString();

    return {
      name: model.model || "n/a",
      value: model.total_requests,
      color: modelColors[index % modelColors.length],
      href: urlString,
      target: "_self",
    };
  };

  const statusSet = overTimeData.requestsWithStatus.data?.data?.reduce<
    Set<number>
  >((acc, { status }) => {
    acc.add(status);
    return acc;
  }, new Set<number>());

  const uniqueStatusCodes = Array.from(statusSet || []).sort();

  const statusStrings = uniqueStatusCodes.map((status) => {
    if (status === -3) {
      return "cancelled";
    } else {
      return status.toString();
    }
  });

  const flattenedObject = overTimeData.requestsWithStatus.data?.data?.reduce(
    (acc, { count, status, time }) => {
      const formattedTime = new Date(time).toUTCString();
      if (!acc[formattedTime]) {
        acc[formattedTime] = statusStrings.reduce(
          (statusAcc: StatusCounts, status) => {
            statusAcc[status] = 0;
            return statusAcc;
          },
          {}
        );
      }

      const statusStr = String(status);
      acc[formattedTime][statusStr] =
        (acc[formattedTime][statusStr] || 0) + count;

      return acc;
    },
    {} as { [key: string]: StatusCounts }
  );

  const flattenedArray = Object.entries(flattenedObject || {})
    .map(([time, status]) => {
      // create copy
      let modifiedStatus = { ...status };

      // if the status object has a `-3` key, rename the key to `cancelled`
      if (modifiedStatus["-3"] !== undefined) {
        modifiedStatus["cancelled"] = modifiedStatus["-3"];
        delete modifiedStatus["-3"];
      }

      return {
        date: time,
        ...modifiedStatus,
      };
    })
    .map((obj) => ({
      ...obj,
      date: getTimeMap(timeIncrement)(new Date(obj.date)),
    }));

  const [currentStatus, setCurrentStatus] = useState<string[]>(["200"]);

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
              currentTimeFilter: timeFilter,
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
              onAdvancedFilter: onSetAdvancedFilters,
              filters: advancedFilters,
              searchPropertyFilters: () => {
                throw new Error("not implemented");
              },
            }}
          />
          <section id="panels" className="-m-2">
            <ResponsiveGridLayout
              className="layout"
              layouts={{
                lg: initialLayout,
                md: initialLayout,
                sm: initialLayout,
                xs: smallLayout,
                xxs: smallLayout,
              }}
              autoSize={true}
              isBounded={true}
              isDraggable={false}
              breakpoints={{ lg: 1200, md: 996, sm: 600, xs: 360, xxs: 0 }}
              cols={gridCols}
              rowHeight={72}
              onLayoutChange={(currentLayout, allLayouts) => {}}
            >
              <div key="requests">
                <Card>
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-gray-500 text-sm">Requests</p>
                      <p className="text-black dark:text-white text-xl font-semibold">
                        {metrics.totalRequests?.data?.data
                          ? `${formatNumberString(
                              metrics.totalRequests?.data?.data.toFixed(2)
                            )}`
                          : "0"}
                      </p>
                    </div>
                    {!overTimeData.requests.isLoading && (
                      <MultiSelect
                        placeholder="Select status codes"
                        value={currentStatus}
                        onValueChange={(values: string[]) => {
                          setCurrentStatus(
                            values.sort((a, b) => {
                              if (a === "200") {
                                return -1;
                              } else if (b === "200") {
                                return 1;
                              } else {
                                return Number(a) - Number(b);
                              }
                            })
                          );
                        }}
                        className="border border-gray-400 rounded-lg w-fit min-w-[250px] max-w-xl"
                      >
                        {statusStrings
                          .sort((a, b) => {
                            if (a === "200") {
                              return -1;
                            } else if (b === "200") {
                              return 1;
                            } else {
                              return Number(a) - Number(b);
                            }
                          })
                          .filter((status) => status !== "0")
                          .map((status, idx) => (
                            <MultiSelectItem
                              value={status}
                              key={idx}
                              className="font-medium text-black"
                            >
                              {status}
                            </MultiSelectItem>
                          ))}
                      </MultiSelect>
                    )}
                  </div>

                  <div
                    className={clsx("p-2", "w-full")}
                    style={{
                      height: "224px",
                    }}
                  >
                    {overTimeData.requests.isLoading ? (
                      <div className="h-full w-full bg-gray-200 dark:bg-gray-800 rounded-md pt-4">
                        <LoadingAnimation height={175} width={175} />
                      </div>
                    ) : (
                      <AreaChart
                        className="h-[14rem]"
                        data={flattenedArray}
                        index="date"
                        categories={currentStatus}
                        colors={[
                          "green",
                          "red",
                          "blue",
                          "yellow",
                          "orange",
                          "indigo",
                          "orange",
                          "pink",
                        ]}
                        showYAxis={false}
                        curveType="monotone"
                      />
                    )}
                  </div>
                </Card>
              </div>
              {metricsData.map((m, i) => (
                <div key={m.id}>
                  <MetricsPanel metric={m} hFull={true} />
                </div>
              ))}
              <div key="models">
                <StyledAreaChart
                  title={`Top Models`}
                  value={undefined}
                  isDataOverTimeLoading={isLoading}
                >
                  <div className="flex flex-row justify-between items-center pb-2">
                    <p className="text-xs font-semibold text-gray-700">Name</p>
                    <p className="text-xs font-semibold text-gray-700">
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
                  value={metrics.activeUsers.data?.data ?? 0}
                  isDataOverTimeLoading={overTimeData.users.isLoading}
                  // height={"212px"}
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
              <div key="latency">
                <StyledAreaChart
                  title={"Latency"}
                  value={`${
                    metrics.averageLatency.data?.data?.toFixed(0) ?? 0
                  } ms / req`}
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
                  />
                </StyledAreaChart>
              </div>
            </ResponsiveGridLayout>
          </section>
        </div>
      )}
      <UpgradeProModal open={open} setOpen={setOpen} />
    </>
  );
};

export default DashboardPage;
