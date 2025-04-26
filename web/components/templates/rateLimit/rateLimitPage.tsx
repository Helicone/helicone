import { useOrg } from "@/components/layout/org/organizationContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { format } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { Result, resultMap } from "../../../packages/common/result";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { useBackendMetricCall } from "../../../services/hooks/useBackendFunction";
import { TimeFilter } from "../../../services/lib/filters/filterDefs";
import { Col } from "../../layout/common/col";
import LoadingAnimation from "../../shared/loadingAnimation";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import useSearchParams from "../../shared/utils/useSearchParams";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import RequestsPage from "../requests/RequestsPage";
import UnauthorizedView from "../requests/UnauthorizedView";
import router from "next/router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H2, P } from "@/components/ui/typography";
import Header from "@/components/shared/Header";

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--destructive))", // Use semantic red for rate limits
  },
} satisfies ChartConfig;

const TABS = [
  {
    id: "requests",
    label: "Rate Limited Requests",
  },
  {
    id: "rules",
    label: "Rate Limit Rules",
  },
];

const RateLimitPage = (props: {}) => {
  const searchParams = useSearchParams();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>({
    start: getTimeIntervalAgo("24h"),
    end: new Date(),
  });

  const [currentTab, useCurrentTab] = useState<string>("requests");

  const org = useOrg();
  const { user } = useHeliconeAuthClient();
  const {
    unauthorized,
    currentTier,
    isLoading: isAuthLoading,
  } = useGetUnauthorized(user?.id || "");

  // Define mock data inside component using useMemo for stability
  const memoizedMockData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000);
      const count = Math.floor(Math.random() * 15) + (i % 3 === 0 ? 5 : 0);
      data.push({ time, count });
    }
    return data;
  }, []); // Empty dependency array means it runs only once

  const rateLimitOverTime = useBackendMetricCall<
    Result<RequestsOverTime[], string>
  >({
    params: {
      timeFilter: timeFilter,
      userFilters: {
        left: {
          request_response_rmt: {
            properties: {
              "Helicone-Rate-Limit-Status": {
                equals: "rate_limited",
              },
            },
          },
        },
        operator: "and",
        right: "all",
      },
      timeZoneDifference: 0,
    },
    endpoint: "/api/metrics/requestOverTime",
    key: "requestOverTime",
    postProcess: (data) => {
      return resultMap(data, (d) =>
        d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
      );
    },
  });

  const onTimeSelectHandler = useCallback(
    (key: string, value: string) => {
      let newTimeFilter: TimeFilter;
      let newTimeParamValue: string;

      if (key === "custom") {
        const [start, end] = value.split("_");
        newTimeFilter = {
          start: new Date(start),
          end: new Date(end),
        };
        newTimeParamValue = `custom_${value}`;
      } else {
        newTimeFilter = {
          start: getTimeIntervalAgo(key as TimeInterval),
          end: new Date(),
        };
        newTimeParamValue = key;
      }

      setTimeFilter(newTimeFilter);

      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, t: newTimeParamValue },
        },
        undefined,
        { shallow: true }
      );
    },
    [setTimeFilter, router]
  );

  const getDefaultValue = useCallback(() => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    }
    const validIntervals: TimeInterval[] = [
      "1h",
      "24h",
      "7d",
      "1m",
      "3m",
      "all",
    ];
    if (
      currentTimeFilter &&
      validIntervals.includes(currentTimeFilter as TimeInterval)
    ) {
      return currentTimeFilter;
    }
    return "24h";
  }, [searchParams]);

  const handleCreateRateLimit = () => {
    router.push("/settings/rate-limits");
  };

  const hasRateLimitData = false;
  const shouldShowUnauthorized = hasRateLimitData && unauthorized;
  const isOrgLoading = !org || !org.currentOrg;
  const isUserLoading = user === undefined;
  const isLoading = isOrgLoading || isAuthLoading || isUserLoading;

  if (isLoading) {
    return <LoadingAnimation title="Loading..." height={175} width={175} />;
  }

  if (shouldShowUnauthorized) {
    return (
      <UnauthorizedView currentTier={currentTier || ""} pageType="ratelimit" />
    );
  }

  const renderRateLimitRequests = () => {
    const showMockData = org?.currentOrg?.has_onboarded === false;
    const chartData = showMockData
      ? memoizedMockData
      : rateLimitOverTime.data?.data ?? [];
    const isChartLoading = showMockData ? false : rateLimitOverTime.isLoading;

    return (
      <Col>
        <div className="h-full w-full bg-card text-card-foreground rounded-md pt-4">
          {isChartLoading ? (
            <div className="h-[14rem] flex items-center justify-center">
              <LoadingAnimation height={100} width={100} />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[14rem] w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 12, right: 12, top: 5, bottom: 5 }}
              >
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    try {
                      const date =
                        value instanceof Date ? value : new Date(value);
                      return !isNaN(date.getTime())
                        ? format(date, "MMM d, HH:mm")
                        : "";
                    } catch (e) {
                      return "";
                    }
                  }}
                  tickCount={7}
                  interval="preserveStartEnd"
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 border-t">
          <RequestsPage
            currentPage={1}
            pageSize={25}
            sort={{
              sortKey: null,
              sortDirection: null,
              isCustomProperty: false,
            }}
            rateLimited={true}
            organizationLayoutAvailable={false}
          />
        </div>
      </Col>
    );
  };

  const renderRateLimitRules = () => (
    <Col className="gap-8">
      <div className="flex flex-col gap-6 p-8 bg-white dark:bg-gray-800 rounded-md">
        <div className="flex justify-between items-center">
          <H2>Rate Limit Rules</H2>
          <button
            className="text-white dark:text-black bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-md font-medium text-sm"
            onClick={handleCreateRateLimit}
          >
            Create Rate Limit
          </button>
        </div>
        <P className="text-muted-foreground">
          Create and manage rate limits for your organization. Rate limits can
          be applied to specific keys.
        </P>
        <div className="border rounded-md p-6 flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
          <P className="text-center text-muted-foreground">
            No rate limits defined yet. Create your first rate limit rule to get
            started.
          </P>
        </div>
      </div>
    </Col>
  );

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => useCurrentTab(value)}
      className="w-full"
    >
      <div>
        <Header
          title="Rate Limits"
          leftActions={
            currentTab === "requests" ? (
              <ThemedTimeFilter
                currentTimeFilter={timeFilter}
                timeFilterOptions={[]}
                onSelect={onTimeSelectHandler}
                isFetching={false}
                defaultValue={getDefaultValue()}
                custom={true}
              />
            ) : null
          }
          rightActions={[
            <TabsList className="mr-8" key="tabs-list">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>,
          ]}
        />
        <TabsContent value="requests">{renderRateLimitRequests()}</TabsContent>
        <TabsContent value="rules">{renderRateLimitRules()}</TabsContent>
      </div>
    </Tabs>
  );
};

export default RateLimitPage;
