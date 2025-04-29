import { useOrg } from "@/components/layout/org/organizationContext";
import { useMemo, useState } from "react";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import {
  getTimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { Result, resultMap } from "../../../packages/common/result";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { useBackendMetricCall } from "../../../services/hooks/useBackendFunction";
import { TimeFilter } from "@/types/timeFilter";
import LoadingAnimation from "../../shared/loadingAnimation";
import useSearchParams from "../../shared/utils/useSearchParams";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import UnauthorizedView from "../requests/UnauthorizedView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/shared/Header";
import RateLimitRequestsView from "./RateLimitRequestsView";
import RateLimitRulesView from "./RateLimitRulesView";
import { type ChartConfig } from "@/components/ui/chart";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { Small } from "@/components/ui/typography";
import ThemedTimeFilter from "@/components/shared/themed/themedTimeFilter";
import { TimeInterval } from "@/lib/timeCalculations/time";
import { useRouter } from "next/router";

const TABS = [
  { id: "requests", label: "Rate Limited Requests" },
  { id: "rules", label: "Rate Limit Rules" },
];

// Helper function to parse URL param into TimeFilter object
// TODO: Extract this to a shared utility
const getTimeFilterFromParam = (paramValue: string | null): TimeFilter => {
  const defaultValue: TimeFilter = {
    start: getTimeIntervalAgo("24h"),
    end: new Date(),
  };

  if (!paramValue) {
    return defaultValue;
  }

  if (paramValue.startsWith("custom_")) {
    const parts = paramValue.split("_");
    if (parts.length === 3) {
      const start = new Date(parts[1]);
      const end = new Date(parts[2]);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return { start, end };
      }
    }
  } else {
    try {
      const start = getTimeIntervalAgo(paramValue as TimeInterval);
      return { start, end: new Date() };
    } catch (e) {
      // Ignore invalid interval string, fall through to default
    }
  }

  return defaultValue;
};

const RateLimitPage = (props: {}) => {
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useLocalStorage<string>(
    "rateLimitPageActiveTab",
    "requests"
  );
  const org = useOrg();
  const { user } = useHeliconeAuthClient();
  const {
    unauthorized,
    currentTier,
    isLoading: isAuthLoading,
  } = useGetUnauthorized(user?.id || "");

  const urlTimeFilter = useMemo(() => {
    const timeParam = searchParams.get("t");
    const result = getTimeFilterFromParam(timeParam);
    return {
      start: result.start,
      end: result.end,
    };
  }, [searchParams.get("t")]);

  const timeIncrement = useMemo(
    () => getTimeInterval(urlTimeFilter),
    [urlTimeFilter]
  );

  const timeZoneDifference = useMemo(() => new Date().getTimezoneOffset(), []);

  const backendParams = useMemo(
    () => ({
      timeFilter: urlTimeFilter,
      userFilters: {
        left: {
          request_response_rmt: {
            properties: {
              "Helicone-Rate-Limit-Status": { equals: "rate_limited" },
            },
          },
        },
        operator: "and" as const, // Ensure const for type stability
        right: "all" as const,
      },
      timeZoneDifference,
      dbIncrement: timeIncrement,
    }),
    [urlTimeFilter, timeIncrement, timeZoneDifference]
  );

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
    params: backendParams, // <-- Use memoized params
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
      onValueChange={(value) => setCurrentTab(value)}
      className="w-full"
    >
      <div>
        <Header
          title="Rate Limits"
          leftActions={
            currentTab === "rules" ? (
              <div className="flex items-center gap-1.5 ml-4">
                <TooltipProvider key="rules-tooltip">
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild className="flex items-center">
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm" side="bottom">
                      <p className="mb-2">
                        Only one rate limit rule applies per request, based on
                        the following priority:
                      </p>
                      <p className="font-medium mb-1">
                        Rule Priority & Sorting
                      </p>
                      <p>
                        Rules are automatically sorted by application priority:
                      </p>
                      <ul className="list-disc pl-4 mt-1 text-xs space-y-0.5">
                        <li>
                          <span className="font-semibold">Segment:</span>{" "}
                          Property rules apply first, then User, then Global.
                        </li>
                        <li>
                          <span className="font-semibold">
                            Restrictiveness:
                          </span>{" "}
                          Within the same Segment & Unit, the rule with the
                          lowest effective quota (quota / time window) applies
                          first.
                        </li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <></>
            )
          }
          rightActions={[
            <div
              key="header-right-wrapper"
              className="flex items-center justify-end w-full gap-4"
            >
              <TabsList>
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>,
          ]}
        />
        <TabsContent value="requests">
          <RateLimitRequestsView
            isLoading={isChartLoading}
            chartData={chartData}
            timeFilter={urlTimeFilter}
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
