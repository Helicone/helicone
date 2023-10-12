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
import { useRouter } from "next/router";
import { useGetAuthorized } from "../../../services/hooks/dashboard";
import { User } from "@supabase/auth-helpers-nextjs";
import UpgradeProModal from "../../shared/upgradeProModal";
import MainGraph from "./graphs/mainGraph";
import useSearchParams from "../../shared/utils/useSearchParams";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import { Responsive, WidthProvider } from "react-grid-layout";
import StyledAreaChart from "./styledAreaChart";
import { AreaChart, BarChart } from "@tremor/react";
import { getUSDate, getUSDateShort } from "../../shared/utils/utils";
import { useLocalStorage } from "../../../services/hooks/localStorage";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardPageProps {
  user: User;
}

export type TimeFilter = {
  start: Date;
  end: Date;
};

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
      console.log("Error decoding advanced filters:", error);
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
      console.log("Error decoding filter:", error);
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

  const combineRequestsAndErrors = () => {
    let combinedArray = overTimeData.requests.data?.data?.map(
      (request, index) => ({
        date: getUSDateShort(request.time.toString()),
        requests: request.count,
        errors: overTimeData.errors.data?.data
          ? overTimeData.errors.data?.data[index].count > 0
            ? overTimeData.errors.data?.data[index].count
            : null
          : null,
      })
    );
    return combinedArray || [];
  };

  const combinePositiveAndNegativeFeedback = () => {
    let combinedArray = overTimeData.feedback.data?.data?.map((feedback) => ({
      date: getUSDateShort(feedback.time.toString()),
      positive: feedback.positiveCount > 0 ? feedback.positiveCount : null,
      negative: feedback.negativeCount > 0 ? feedback.negativeCount : null,
    }));
    return combinedArray || [];
  };

  const metricsData: MetricsPanelProps["metric"][] = [
    {
      id: "cost-req",
      value:
        metrics.totalCost.data?.data && metrics.totalRequests?.data?.data
          ? `$${(
              metrics.totalCost.data.data / metrics.totalRequests?.data?.data
            ).toFixed(3)}`
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
    { i: "costs", x: 0, y: 4, w: 6, h: 4, minW: 3, maxW: 8, minH: 4, maxH: 4 },
    { i: "users", x: 6, y: 4, w: 6, h: 4, minW: 3, maxW: 8, minH: 4, maxH: 4 },
    {
      i: "feedback",
      x: 0,
      y: 8,
      w: 6,
      h: 4,
      minW: 3,
      maxW: 8,
      minH: 4,
      maxH: 4,
    },
    {
      i: "latency",
      x: 6,
      y: 8,
      w: 6,
      h: 4,
      minW: 3,
      maxW: 8,
      minH: 4,
      maxH: 4,
    },
  ];

  const gridCols = { lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 };

  const [currentLayout, setCurrentLayout] = useLocalStorage(
    "dashboardLayout",
    JSON.stringify(initialLayout)
  );

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
                lg: JSON.parse(currentLayout) || initialLayout,
                md: JSON.parse(currentLayout) || initialLayout,
                sm: JSON.parse(currentLayout) || initialLayout,
                xs: JSON.parse(currentLayout) || initialLayout,
                xxs: JSON.parse(currentLayout) || initialLayout,
              }}
              autoSize={true}
              isBounded={true}
              breakpoints={{ lg: 1200, md: 996, sm: 600, xs: 360, xxs: 0 }}
              cols={gridCols}
              rowHeight={72}
              onLayoutChange={(currentLayout, allLayouts) => {}}
            >
              <div key="requests">
                <StyledAreaChart
                  title={"Requests"}
                  value={
                    metrics.totalRequests?.data?.data
                      ? `${formatNumberString(
                          metrics.totalRequests?.data?.data.toFixed(2)
                        )}`
                      : "0"
                  }
                >
                  <AreaChart
                    className="h-[14rem]"
                    data={combineRequestsAndErrors()}
                    index="date"
                    categories={["requests", "errors"]}
                    colors={["green", "red"]}
                    showYAxis={false}
                  />
                </StyledAreaChart>
              </div>
              {metricsData.map((m, i) => (
                <div key={m.id}>
                  <MetricsPanel metric={m} />
                </div>
              ))}
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
                >
                  <BarChart
                    className="h-[14rem]"
                    data={
                      overTimeData.costs.data?.data?.map((r) => ({
                        date: getUSDateShort(r.time.toString()),
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
                >
                  <BarChart
                    className="h-[14rem]"
                    data={
                      overTimeData.users.data?.data?.map((r) => ({
                        date: getUSDateShort(r.time.toString()),
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
              <div key="feedback">
                <StyledAreaChart
                  title={"Feedback"}
                  value={
                    metrics.feedback?.data?.data
                      ? `${formatNumberString(
                          metrics.feedback?.data?.data.toFixed(2)
                        )}`
                      : "0"
                  }
                >
                  <AreaChart
                    className="h-[14rem]"
                    data={combinePositiveAndNegativeFeedback()}
                    index="date"
                    categories={["positive", "negative"]}
                    colors={["green", "red"]}
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
                >
                  <AreaChart
                    className="h-[14rem]"
                    data={
                      overTimeData.latency.data?.data?.map((r) => ({
                        date: getUSDateShort(r.time.toString()),
                        latency: r.duration,
                      })) ?? []
                    }
                    index="date"
                    categories={["latency"]}
                    colors={["cyan"]}
                    showYAxis={false}
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
