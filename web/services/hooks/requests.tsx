import { useQuery } from "@tanstack/react-query";
import { HeliconeRequest } from "../../lib/api/request/request";
import { Result } from "../../lib/result";
import { FilterNode } from "../lib/filters/filterDefs";
import { SortLeafRequest } from "../lib/sorts/requests/sorts";
import { getHeliconeCookie } from "../../lib/cookies";
import { useOrg } from "../../components/layout/organizationContext";

const useGetRequest = (requestId: string) => {
  const org = useOrg();
  const { data, isLoading } = useQuery({
    queryKey: ["requestData", requestId, org?.currentOrg?.id],
    queryFn: async (query) => {
      const requestId = query.queryKey[1] as string;
      const orgId = query.queryKey[2];
      if (!orgId) {
        return {
          data: [],
          error: "No org provided",
        };
      }
      const authFromCookie = getHeliconeCookie();
      return await fetch(
        `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/request/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "helicone-authorization": JSON.stringify({
              _type: "jwt",
              token: authFromCookie.data?.jwtToken,
              orgId: orgId,
            }),
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
        }
      ).then((res) => res.json() as Promise<Result<HeliconeRequest, string>>);
    },
    refetchOnWindowFocus: false,
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
  const org = useOrg();
  return {
    requests: useQuery({
      queryKey: [
        "requestsData",
        currentPage,
        currentPageSize,
        advancedFilter,
        sortLeaf,
        isCached,
        org?.currentOrg?.id,
      ],
      queryFn: async (query) => {
        const currentPage = query.queryKey[1] as number;
        const currentPageSize = query.queryKey[2] as number;
        const advancedFilter = query.queryKey[3];
        const sortLeaf = query.queryKey[4];
        const isCached = query.queryKey[5];
        const orgId = query.queryKey[6];
        if (!orgId) {
          return {
            data: [],
            error: "No org provided",
          };
        }
        const authFromCookie = getHeliconeCookie();
        return await fetch(
          `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/request/query`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "helicone-authorization": JSON.stringify({
                _type: "jwt",
                token: authFromCookie.data?.jwtToken,
                orgId: orgId,
              }),
            },
            body: JSON.stringify({
              filter: advancedFilter,
              offset: (currentPage - 1) * currentPageSize,
              limit: currentPageSize,
              sort: sortLeaf,
              isCached,
            }),
          }
        ).then(
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

export { useGetRequests, useGetRequestCountClickhouse, useGetRequest };
