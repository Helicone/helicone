import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useOrg } from "../../components/layout/org/organizationContext";
import { HeliconeRequest } from "@helicone-package/llm-mapper/types";
import { $JAWN_API, getJawnClient } from "../../lib/clients/jawn";
import { Result } from "@/packages/common/result";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { placeAssetIdValues } from "../lib/requestTraverseHelper";
import { SortLeafRequest } from "../lib/sorts/requests/sorts";
import { MAX_EXPORT_ROWS } from "@/lib/constants";
import { TSessions } from "@/components/templates/sessions/sessionsPage";
import { logger } from "@/lib/telemetry/logger";

function formatDateForClickHouse(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function isISODateString(value: any): boolean {
  if (typeof value !== "string") return false;
  // match: 2025-04-08T00:32:56.000Z
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  return isoDateRegex.test(value) && !isNaN(Date.parse(value));
}

function processFilter(filter: any): any {
  if (typeof filter !== "object" || filter === null) {
    return filter;
  }

  const result: any = Array.isArray(filter) ? [] : {};
  for (const key in filter) {
    const isDateISO = isISODateString(filter[key]);
    const isDate = filter[key] instanceof Date && !isNaN(filter[key].getTime());

    if (typeof filter[key] === "object" && !isDate) {
      result[key] = processFilter(filter[key]);
    } else if (isDate || isDateISO) {
      const dateToFormat = isDateISO ? new Date(filter[key]) : filter[key];
      const formattedDate = formatDateForClickHouse(dateToFormat);
      result[key] = formattedDate;
    } else {
      result[key] = filter[key];
    }
  }

  return result;
}

interface RequestBodyContent {
  request: any;
  response: any;
}

const requestBodyCache = new Map<string, RequestBodyContent>();

export const useGetRequestWithBodies = (requestId: string) => {
  const org = useOrg();

  return useQuery({
    queryKey: ["single-request", requestId, org?.currentOrg?.id],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const response = await jawn.GET(`/v1/request/{requestId}`, {
        params: {
          path: {
            requestId,
          },
        },
      });
      if (!response.data?.data?.signed_body_url) return response.data;
      if (response.data.data && response.data.data.signed_body_url) {
        const contentResponse = await fetch(response.data.data.signed_body_url);
        if (contentResponse.ok) {
          const text = await contentResponse.text();
          let content = JSON.parse(text);
          if (response.data?.data?.asset_urls) {
            content = placeAssetIdValues(
              response.data?.data?.asset_urls,
              content,
            );
          }
          requestBodyCache.set(response.data?.data?.request_id, content);
          if (requestBodyCache.size > 1000) {
            requestBodyCache.clear();
          }
          response.data.data.response_body = content.response;
          response.data.data.request_body = content.request;
        }
      }

      return response.data as Result<HeliconeRequest, string>;
    },
    enabled: !!requestId && !!org?.currentOrg?.id,
  });
};

export const useGetRequestsWithBodies = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest,
  isLive: boolean = false,
  isCached: boolean = false,
) => {
  // First query to fetch the initial request data
  const requestQuery = $JAWN_API.useQuery(
    "post",
    "/v1/request/query-clickhouse",
    {
      body: {
        filter: advancedFilter as any,
        offset: (currentPage - 1) * currentPageSize,
        limit: currentPageSize,
        sort: sortLeaf as any,
        isCached: isCached as any,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 1_000 : false,
      keepPreviousData: true,
    },
  );

  // Second query to fetch and process request bodies
  const { data: requests, isLoading: bodiesLoading } = useQuery<
    HeliconeRequest[]
  >({
    queryKey: ["requestsWithSignedUrls", requestQuery.data?.data],
    placeholderData: (prev) => prev,
    enabled: !!requestQuery.data?.data?.length,
    queryFn: async () => {
      try {
        return await Promise.all(
          requestQuery.data?.data?.map(async (request) => {
            // Return from cache if available
            if (requestBodyCache.has(request.request_id)) {
              const bodyContent = requestBodyCache.get(request.request_id);
              return {
                ...request,
                request_body: bodyContent?.request,
                response_body: bodyContent?.response,
              };
            }

            // Skip if no signed URL is available
            if (!request.signed_body_url) return request;

            try {
              const contentResponse = await fetch(request.signed_body_url);
              if (!contentResponse.ok) {
                logger.error(
                  { status: contentResponse.status },
                  "Error fetching request body",
                );
                return request;
              }

              const text = await contentResponse.text();
              let content = JSON.parse(text);

              if (request.asset_urls) {
                content = placeAssetIdValues(request.asset_urls, content);
              }

              // Update cache with size limit protection
              requestBodyCache.set(request.request_id, content);
              if (requestBodyCache.size > 10_000) {
                requestBodyCache.clear();
              }

              return {
                ...request,
                request_body: content.request,
                response_body: content.response,
              };
            } catch (error) {
              logger.error({ error }, "Error processing request body");
              return request;
            }
          }) ?? [],
        );
      } catch (error) {
        logger.error({ error }, "Error processing requests with bodies");
        return [];
      }
    },
  });

  const mergedRequests = useMemo(() => {
    const rawRequests = requestQuery.data?.data ?? [];
    return rawRequests.map((rawRequest) => {
      const requestWithBody = requests?.find(
        (request) => request.request_id === rawRequest.request_id,
      );
      if (requestWithBody) {
        return requestWithBody;
      }
      return rawRequest;
    });
  }, [requestQuery, requests]);

  return {
    isLoading: requestQuery.isLoading || bodiesLoading,
    refetch: requestQuery.refetch,
    isRefetching: requestQuery.isRefetching,
    requests: mergedRequests,
    completedQueries: mergedRequests?.length ?? 0,
    totalQueries: mergedRequests?.length ?? 0,
  };
};

const useGetRequestCount = (
  filter: FilterNode,
  isLive = false,
  isCached = false,
) => {
  const processedFilter = processFilter(filter);
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/requestCount",
    {
      body: {
        filter: processedFilter as any,
        isCached,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 2_000 : false,
      gcTime: 5 * 60 * 1000,
    },
  );
};

const useGetRequests = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest,
  isCached: boolean = false,
  isLive: boolean = false,
) => {
  return {
    requests: useGetRequestsWithBodies(
      currentPage,
      currentPageSize,
      advancedFilter,
      sortLeaf,
      isLive,
      isCached,
    ),
    count: useGetRequestCount(advancedFilter, isLive, isCached),
  };
};

const useGetRequestCountClickhouse = (
  startDateISO: string,
  endDateISO: string,
) => {
  const { data, isLoading, refetch } = $JAWN_API.useQuery(
    "post",
    "/v1/request/count/query",
    {
      body: {
        filter: {
          left: {
            request_response_rmt: {
              request_created_at: {
                gte: startDateISO,
              },
            },
          },
          operator: "and",
          right: {
            request_response_rmt: {
              request_created_at: {
                lte: endDateISO,
              },
            },
          },
        },
      },
    },
    { refetchOnWindowFocus: false },
  );

  return {
    count: data,
    isLoading,
    refetch,
  };
};

const getRequestBodiesBySession = async (sessions: TSessions[]) => {
  const filter = sessions.reduce((acc: any, session, index) => {
    const currentCondition = {
      request_response_rmt: {
        properties: {
          "Helicone-Session-Id": {
            equals: session.metadata.session_id,
          },
          "Helicone-Session-Name": {
            equals: session.metadata.session_name,
          },
        },
      },
    };

    if (index === 0) return currentCondition;

    return {
      left: acc,
      operator: "or" as const,
      right: currentCondition,
    };
  }, {});

  try {
    const response = await $JAWN_API.POST("/v1/request/query-clickhouse", {
      body: {
        filter,
        offset: 0,
        limit: MAX_EXPORT_ROWS,
        sort: {
          created_at: "desc",
        },
        isCached: false,
      },
    });

    const requests = response.data?.data ?? [];

    return await Promise.all(
      requests.map(async (request) => {
        if (requestBodyCache.has(request.request_id)) {
          const bodyContent = requestBodyCache.get(request.request_id);
          return {
            ...request,
            request_body: bodyContent?.request,
            response_body: bodyContent?.response,
          };
        }

        if (!request.signed_body_url) return request;

        try {
          const contentResponse = await fetch(request.signed_body_url);
          if (!contentResponse.ok) {
            logger.error(
              { status: contentResponse.status },
              "Error fetching request body",
            );
            return request;
          }

          const text = await contentResponse.text();
          let content = JSON.parse(text);

          if (request.asset_urls) {
            content = placeAssetIdValues(request.asset_urls, content);
          }

          requestBodyCache.set(request.request_id, content);
          if (requestBodyCache.size > 10_000) {
            requestBodyCache.clear();
          }

          return {
            ...request,
            request_body: content.request,
            response_body: content.response,
          };
        } catch (error) {
          logger.error({ error }, "Error processing request body");
          return request;
        }
      }),
    );
  } catch (error) {
    logger.error(
      { error },
      "Error fetching requests by session IDs with bodies",
    );
    throw error;
  }
};

export {
  useGetRequestCountClickhouse,
  useGetRequestCount,
  useGetRequests,
  getRequestBodiesBySession as getRequestsByIdsWithBodies,
};
