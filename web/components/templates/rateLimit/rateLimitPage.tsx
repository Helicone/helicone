import { useOrg } from "@/components/layout/org/organizationContext";
import { useMemo, useState } from "react";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import { getTimeIntervalAgo } from "../../../lib/timeCalculations/time";
import { Result, resultMap } from "../../../packages/common/result";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { useBackendMetricCall } from "../../../services/hooks/useBackendFunction";
import { TimeFilter } from "../../../services/lib/filters/filterDefs";
import LoadingAnimation from "../../shared/loadingAnimation";
import useSearchParams from "../../shared/utils/useSearchParams";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import UnauthorizedView from "../requests/UnauthorizedView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/shared/Header";
import RateLimitRequestsView from "./RateLimitRequestsView";
import RateLimitRulesView from "./RateLimitRulesView";
import { type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  count: {
    label: "Count",
    color: "rgb(226, 54, 112)",
  },
} satisfies ChartConfig;

const TABS = [
  { id: "requests", label: "Rate Limited Requests" },
  { id: "rules", label: "Rate Limit Rules" },
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

  const memoizedMockData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000);
      const count = Math.floor(Math.random() * 15) + (i % 3 === 0 ? 5 : 0);
      data.push({ time, count });
    }
    return data;
  }, []);

  const rateLimitOverTime = useBackendMetricCall<
    Result<RequestsOverTime[], string>
  >({
    params: {
      timeFilter: timeFilter,
      userFilters: {
        left: {
          request_response_rmt: {
            properties: {
              "Helicone-Rate-Limit-Status": { equals: "rate_limited" },
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
        d.map((item) => ({ count: +item.count, time: new Date(item.time) }))
      );
    },
  });

  const showMockData = org?.currentOrg?.has_onboarded === false;
  const chartData = showMockData
    ? memoizedMockData
    : rateLimitOverTime.data?.data ?? [];
  const isChartLoading = showMockData ? false : rateLimitOverTime.isLoading;

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

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => useCurrentTab(value)}
      className="w-full"
    >
      <div>
        <Header
          title="Rate Limits"
          leftActions={<></>}
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
        <TabsContent value="requests">
          <RateLimitRequestsView
            isLoading={isChartLoading}
            chartData={chartData}
            chartConfig={chartConfig}
            timeFilter={timeFilter}
          />
        </TabsContent>
        <TabsContent value="rules">
          <RateLimitRulesView />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default RateLimitPage;
