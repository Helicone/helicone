import { useQuery } from "@tanstack/react-query";
import { HeliconeRequest } from "../../lib/api/request/request";
import { useJawnClient } from "../../lib/clients/jawnHook";
import { Result } from "../../lib/result";
import { FilterNode } from "../lib/filters/filterDefs";
import { SortLeafRequest } from "../lib/sorts/requests/sorts";

const useGetRequests = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest,
  isCached: boolean = false,
  isLive: boolean = false
) => {
  const jawn = useJawnClient();
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
        const response = await jawn.POST("/v1/request/query", {
          body: {
            filter: advancedFilter as any,
            offset: (currentPage - 1) * currentPageSize,
            limit: currentPageSize,
            sort: sortLeaf as any,
            isCached: isCached as any,
          },
        });

        const result = response.data as Result<HeliconeRequest[], string>;

        const requests = await Promise.all(
          result.data?.map(async (request: HeliconeRequest) => {
            if (request.signed_body_url) {
              try {
                const contentResponse = await fetch(request.signed_body_url);
                if (contentResponse.ok) {
                  const text = await contentResponse.text();

                  const content = JSON.parse(text) as {
                    request: string;
                    response: string;
                  };
                  request.request_body = content.request;
                  request.response_body = content.response;
                }
              } catch (error) {
                console.log(`Error fetching content: ${error}`);
                return request;
              }
            }
            return request; // Return request if no signed_body_url
          }) ?? []
        );

        return { data: requests, error: null };
      },
      refetchOnWindowFocus: false,
      retry: false,
      refetchIntervalInBackground: false,
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
      // cache the count for 5 minutes
      cacheTime: 5 * 60 * 1000,
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
              request_response_log: {
                request_created_at: {
                  gte: startDateISO,
                },
              },
            },
            operator: "and",
            right: {
              request_response_log: {
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

export { useGetRequestCountClickhouse, useGetRequests };
