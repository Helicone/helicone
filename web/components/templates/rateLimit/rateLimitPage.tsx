import { useOrg } from "@/components/layout/org/organizationContext";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import { AreaChart } from "@tremor/react";
import Link from "next/link";
import { useState } from "react";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { Result, resultMap } from "../../../packages/common/result";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import { useBackendMetricCall } from "../../../services/hooks/useBackendFunction";
import { TimeFilter } from "../../../services/lib/filters/filterDefs";
import { getPropertyFiltersV2 } from "../../../services/lib/filters/frontendFilterDefs";
import { Col } from "../../layout/common/col";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import useSearchParams from "../../shared/utils/useSearchParams";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import RequestsPage from "../requests/RequestsPage";
import UnauthorizedView from "../requests/UnauthorizedView";
import router from "next/router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H2, P } from "@/components/ui/typography";
import { useLocalStorage } from "@/services/hooks/localStorage";

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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({
    start: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7),
    end: new Date(),
  });
  const [currentTab, useCurrentTab] = useLocalStorage<string>(
    "rate-limit-tab",
    "requests"
  );

  const searchParams = useSearchParams();
  const { properties, isLoading: propertiesLoading } =
    useGetPropertiesV2(getPropertyFiltersV2);
  const org = useOrg();
  const { user } = useHeliconeAuthClient();
  const {
    unauthorized,
    currentTier,
    isLoading: isAuthLoading,
  } = useGetUnauthorized(user?.id || "");

  const rateLimitFilterLeaf = {
    request_response_rmt: {
      properties: {
        "Helicone-Rate-Limit-Status": {
          equals: "rate_limited",
        },
      },
    },
  };

  const rateLimitOverTime = useBackendMetricCall<
    Result<RequestsOverTime[], string>
  >({
    params: {
      timeFilter: timeFilter,
      userFilters: {
        left: rateLimitFilterLeaf,
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

  const onTimeSelectHandler = (key: string, value: string) => {
    if (key === "custom") {
      const [start, end] = value.split("_");
      setTimeFilter({
        start: new Date(start),
        end: new Date(end),
      });
      return;
    }
    setTimeFilter({
      start: getTimeIntervalAgo(key as TimeInterval),
      end: new Date(),
    });
  };

  const getDefaultValue = () => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    }
    return currentTimeFilter || "24h";
  };

  const handleCreateRateLimit = () => {
    router.push("/settings/rate-limits");
  };

  const hasRateLimitData =
    rateLimitOverTime.data?.data?.some((d) => d.count > 0) || false;
  const shouldShowUnauthorized = hasRateLimitData && unauthorized;
  const isOrgLoading = !org || !org.currentOrg;
  const isUserLoading = user === undefined;
  const isLoading =
    propertiesLoading ||
    rateLimitOverTime.isLoading ||
    isOrgLoading ||
    isAuthLoading ||
    isUserLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingAnimation
          height={175}
          width={175}
          title="Loading rate limit data..."
        />
      </div>
    );
  }

  if (shouldShowUnauthorized) {
    return (
      <UnauthorizedView currentTier={currentTier || ""} pageType="ratelimit" />
    );
  }

  const renderRateLimitRequests = () => (
    <Col className="gap-8">
      <ThemedTimeFilter
        currentTimeFilter={timeFilter}
        timeFilterOptions={[
          { key: "24h", value: "24H" },
          { key: "7d", value: "7D" },
          { key: "1m", value: "1M" },
          { key: "3m", value: "3M" },
        ]}
        onSelect={onTimeSelectHandler}
        isFetching={false}
        defaultValue={getDefaultValue()}
        custom={true}
      />
      <div className="h-full w-full bg-white dark:bg-gray-800 rounded-md pt-4">
        {rateLimitOverTime.isLoading ? (
          <LoadingAnimation height={175} width={175} />
        ) : (
          <AreaChart
            className="h-[14rem]"
            data={
              rateLimitOverTime.data?.data?.map((d) => ({
                time: d.time.toISOString(),
                count: d.count,
              })) ?? []
            }
            index="time"
            categories={["count"]}
            colors={["red"]}
            showYAxis={false}
            curveType="monotone"
          />
        )}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
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
        <AuthHeader
          isWithinIsland={true}
          title={
            <div className="flex items-center gap-2 ml-8">Rate Limits</div>
          }
          actions={
            <div className="flex items-center gap-4">
              <TabsList className="mr-8">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          }
        />

        <TabsContent value="requests">{renderRateLimitRequests()}</TabsContent>

        <TabsContent value="rules">{renderRateLimitRules()}</TabsContent>
      </div>
    </Tabs>
  );
};

export default RateLimitPage;
