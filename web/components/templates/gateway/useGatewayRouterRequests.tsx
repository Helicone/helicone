import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
import { useGetRequests } from "@/services/hooks/requests";
import { TimeFilter } from "@/types/timeFilter";
import { FilterNode } from "@helicone-package/filters/filterDefs";

const useGatewayRouterRequests = ({
  routerHash,
  timeFilter,
  page = 1,
  pageSize = 50,
}: {
  routerHash?: string;
  timeFilter: TimeFilter;
  page?: number;
  pageSize?: number;
}) => {
  const filter: FilterNode = {
    left: {
      request_response_rmt: {
        gateway_router_id: {
          equals: routerHash || "__empty__",
        },
      },
    },
    operator: "and",
    right: {
      left: {
        request_response_rmt: {
          gateway_deployment_target: {
            equals: "cloud",
          },
        },
      },
      operator: "and",
      right: {
        left: {
          request_response_rmt: {
            request_created_at: {
              gte: timeFilter.start,
            },
          },
        },
        operator: "and",
        right: {
          request_response_rmt: {
            request_created_at: {
              lte: timeFilter.end,
            },
          },
        },
      },
    },
  };

  const { requests, count } = useGetRequests(
    page,
    pageSize,
    filter,
    { created_at: "desc" },
    false,
  );

  const isLoading = requests.isLoading;

  return {
    requests: requests?.requests?.map(heliconeRequestToMappedContent) ?? [],
    count: count?.data?.data ?? 0,
    isLoading,
  };
};

export default useGatewayRouterRequests;
