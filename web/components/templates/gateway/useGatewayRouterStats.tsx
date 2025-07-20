import { $JAWN_API } from "@/lib/clients/jawn";
import { TimeIncrement } from "@/lib/timeCalculations/fetchTimeData";
import { TimeFilter } from "@/types/timeFilter";

const useGatewayRouterStats = ({
  routerHash,
  timeFilter,
  timeZoneDifference,
  dbIncrement,
}: {
  routerHash: string;
  timeFilter: TimeFilter;
  timeZoneDifference: number;
  dbIncrement: TimeIncrement;
}) => {
  const {
    data: routerRequestsOverTime,
    isLoading: isLoadingRouterRequestsOverTime,
  } = $JAWN_API.useQuery(
    "get",
    `/v1/gateway/{routerHash}/requests-over-time`,
    {
      params: {
        path: {
          routerHash,
        },
        query: {
          start: timeFilter.start.toISOString(),
          end: timeFilter.end.toISOString(),
          timeZoneDifference,
          dbIncrement,
        },
      },
    },
    {
      enabled: !!routerHash,
    },
  );

  const { data: routerCostOverTime, isLoading: isLoadingRouterCostOverTime } =
    $JAWN_API.useQuery("get", `/v1/gateway/{routerHash}/cost-over-time`, {
      params: {
        path: {
          routerHash,
        },
        query: {
          start: timeFilter.start.toISOString(),
          end: timeFilter.end.toISOString(),
          timeZoneDifference,
          dbIncrement,
        },
      },
    });

  const {
    data: routerLatencyOverTime,
    isLoading: isLoadingRouterLatencyOverTime,
  } = $JAWN_API.useQuery("get", `/v1/gateway/{routerHash}/latency-over-time`, {
    params: {
      path: {
        routerHash,
      },
      query: {
        start: timeFilter.start.toISOString(),
        end: timeFilter.end.toISOString(),
        timeZoneDifference,
        dbIncrement,
      },
    },
  });

  return {
    routerRequestsOverTime,
    isLoadingRouterRequestsOverTime,
    routerCostOverTime,
    isLoadingRouterCostOverTime,
    routerLatencyOverTime,
    isLoadingRouterLatencyOverTime,
  };
};

export default useGatewayRouterStats;
