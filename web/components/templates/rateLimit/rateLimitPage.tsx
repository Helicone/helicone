import { useOrg } from "@/components/layout/org/organizationContext";
import { useMemo, useState } from "react";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import {
  getTimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { Result, resultMap } from "@/packages/common/result";
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
import { useLocalStorage } from "../../../services/hooks/localStorage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { TimeInterval } from "@/lib/timeCalculations/time";
import { useQuery } from "@tanstack/react-query";
import { $JAWN_API } from "@/lib/clients/jawn";

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
    "requests",
  );
  const [triggerOpenCreateRuleModal, setTriggerOpenCreateRuleModal] =
    useState(0);
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
    [urlTimeFilter],
  );

  const timeZoneDifference = useMemo(() => new Date().getTimezoneOffset(), []);

  const backendParams = useMemo(
    () => ({
      timeFilter: urlTimeFilter,
      userFilters: {
        request_response_rmt: {
          properties: {
            "Helicone-Rate-Limit-Status": { equals: "bucket_rate_limited" },
          },
        },
      },
      timeZoneDifference,
      dbIncrement: timeIncrement,
    }),
    [urlTimeFilter, timeIncrement, timeZoneDifference],
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
        d.map((item) => ({ count: +item.count, time: new Date(item.time) })),
      );
    },
  });

  // Fetch Rate Limit Rules (using shared query key)
  const rulesQuery = useQuery({
    queryKey: ["rateLimits", org?.currentOrg?.id],
    queryFn: async () => {
      if (!org?.currentOrg?.id) {
        return null;
      }
      const response = await $JAWN_API.GET("/v1/rate-limits");
      return response;
    },
    enabled: !!org?.currentOrg?.id,
  });

  const rulesCount = rulesQuery.data?.data?.data?.length ?? 0;
  const totalRateLimitedRequests = rateLimitOverTime.data?.data?.reduce(
    (sum, d) => sum + d.count,
    0,
  );
  const shouldShowEmptyState =
    rulesCount === 0 && totalRateLimitedRequests === 0;
  const showMockData =
    org?.currentOrg?.has_onboarded === false && shouldShowEmptyState;

  const chartData = showMockData
    ? memoizedMockData
    : (rateLimitOverTime.data?.data ?? []);
  const isChartLoading = showMockData ? false : rateLimitOverTime.isLoading;

  const hasRateLimitData = false;
  const shouldShowUnauthorized = hasRateLimitData && unauthorized;
  const isOrgLoading = !org || !org.currentOrg;
  const isUserLoading = user === undefined;
  const isLoading = isOrgLoading || isAuthLoading || isUserLoading;

  const handleConfigureClick = () => {
    setCurrentTab("rules");
    setTriggerOpenCreateRuleModal((prev) => prev + 1);
  };

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
              <div className="ml-4 flex items-center gap-1.5">
                <TooltipProvider key="rules-tooltip">
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild className="flex items-center">
                      <InfoIcon className="h-4 w-4 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm" side="bottom">
                      <p className="mb-2">
                        Only one rate limit rule applies per request, based on
                        the following priority:
                      </p>
                      <p className="mb-1 font-medium">
                        Rule Priority & Sorting
                      </p>
                      <p>
                        Rules are automatically sorted by application priority:
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
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
              className="flex w-full items-center justify-end gap-4"
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
            onConfigureClick={handleConfigureClick}
            emptyStateIsVisible={shouldShowEmptyState}
          />
        </TabsContent>
        <TabsContent value="rules">
          <RateLimitRulesView
            triggerOpenCreateModal={triggerOpenCreateRuleModal}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default RateLimitPage;
