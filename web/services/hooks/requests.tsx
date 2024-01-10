import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { HeliconeRequest } from "../../lib/shared/request/request";
import { Result } from "../../lib/shared/result";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { SortLeafRequest } from "../../lib/shared/sorts/requests/sorts";
import { updateRequestFeedback } from "../lib/requests";

const useGetRequest = (requestId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["requestData", requestId],
    queryFn: async (query) => {
      const requestId = query.queryKey[1] as string;
      return await fetch(`/api/request/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            left: {
              request: {
                id: {
                  equals: requestId,
                },
              },
            },
            operator: "and",
            right: "all",
          } as FilterNode,
        }),
      }).then((res) => res.json() as Promise<Result<HeliconeRequest, string>>);
    },
  });
  return {
    request: data?.data,
    isLoading,
  };
};

const useGetRequests = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest,
  isCached: boolean = false,
  isLive: boolean = false
) => {
  return {
    requests: useQuery({
      queryKey: [
        "requestsData",
        currentPage,
        currentPageSize,
        advancedFilter,
        sortLeaf,
        isCached,
      ],
      queryFn: async (query) => {
        const currentPage = query.queryKey[1] as number;
        const currentPageSize = query.queryKey[2] as number;
        const advancedFilter = query.queryKey[3];
        const sortLeaf = query.queryKey[4];
        const isCached = query.queryKey[5];
        return await fetch("/api/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: advancedFilter,
            offset: (currentPage - 1) * currentPageSize,
            limit: currentPageSize,
            sort: sortLeaf,
            isCached,
          }),
        }).then(
          (res) => res.json() as Promise<Result<HeliconeRequest[], string>>
        );
      },
      refetchOnWindowFocus: false,
      retry: false,
      refetchInterval: isLive ? 2_000 : false,
    }),
    count: useQuery({
      queryKey: [
        "requestsCount",
        currentPage,
        currentPageSize,
        advancedFilter,
        sortLeaf,
        isCached,
      ],
      queryFn: async (query) => {
        const advancedFilter = query.queryKey[3];
        const isCached = query.queryKey[5];

        return await fetch("/api/request/count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: advancedFilter,
            isCached,
          }),
        }).then((res) => res.json() as Promise<Result<number, string>>);
      },
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 2_000 : false,
    }),
  };
};

const useGetRequestCountClickhouse = (
  startDateISO: string,
  endDateISO: string,
  orgId?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [`org-count`, orgId],
    queryFn: async (query) => {
      const data = await fetch(`/api/request/ch/count`, {
        method: "POST",
        body: JSON.stringify({
          filter: {
            left: {
              response_copy_v3: {
                request_created_at: {
                  gte: startDateISO,
                },
              },
            },
            operator: "and",
            right: {
              response_copy_v3: {
                request_created_at: {
                  lte: endDateISO,
                },
              },
            },
          },
          organization_id: query.queryKey[1],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());
      return data;
    },
    refetchOnWindowFocus: false,
  });
  return {
    count: data,
    isLoading,
    refetch,
  };
};

export { useGetRequests, useGetRequestCountClickhouse, useGetRequest };
