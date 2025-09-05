import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useFilterAST } from "@/filterAST/context/filterContext";
import { FilterExpression } from "@helicone-package/filters/types";
import { FilterLeaf } from "@helicone-package/filters/filterDefs";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";
import { getJawnClient } from "@/lib/clients/jawn";
import { TimeFilter } from "@/types/timeFilter";

const useUserId = (userId: string) => {
  const org = useOrg();
  const jawn = getJawnClient(org?.currentOrg?.id!);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["users", userId],
    queryFn: async (query) => {
      const userId = query.queryKey[1] as string;

      const timeFilter = {
        start: new Date(
          new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        end: new Date().toISOString(),
      };

      const [response, requestOverTime, costOverTime] = await Promise.all([
        jawn.POST("/v1/user/metrics/query", {
          body: {
            filter: {
              request_response_rmt: {
                user_id: {
                  equals: userId,
                },
              },
            },
            offset: 0,
            limit: 1,
            sort: {
              last_active: "desc",
            },
            timeFilter: {
              startTimeUnixSeconds: Math.floor(
                new Date(
                  new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
                ).getTime() / 1000,
              ),
              endTimeUnixSeconds: Math.floor(new Date().getTime() / 1000),
            },
            timeZoneDifferenceMinutes: new Date().getTimezoneOffset(),
          },
        }),
        fetch("/api/metrics/requestOverTime", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeFilter,
            filter: {
              request_response_rmt: {
                user_id: {
                  equals: userId,
                },
              },
            },
            apiKeyFilter: null,
            dbIncrement: "day",
            timeZoneDifference: new Date().getTimezoneOffset(),
          }),
        }).then((res) => res.json()),
        fetch("/api/metrics/costOverTime", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeFilter,
            filter: {
              request_response_rmt: {
                user_id: {
                  equals: userId,
                },
              },
            },
            apiKeyFilter: null,
            dbIncrement: "day",
            timeZoneDifference: new Date().getTimezoneOffset(),
          }),
        }).then((res) => res.json()),
      ]);

      return {
        response,
        requestOverTime: requestOverTime?.data?.map((d: any) => ({
          requests: +d.count,
          date: new Date(d.time).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        })),
        costOverTime: costOverTime?.data?.map((d: any) => ({
          cost: +d.cost,
          date: new Date(d.time).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        })),
      };
    },
    refetchOnWindowFocus: false,
  });

  const { response, requestOverTime, costOverTime } = data || {
    response: undefined,
    requestOverTime: undefined,
    costOverTime: undefined,
  };

  const users = response?.data?.data?.users || [];

  return {
    user: users[0],
    requestOverTime,
    costOverTime,
    isLoading,
  };
};

const useUsers = (
  currentPage: number,
  currentPageSize: number,
  sortLeaf: any,
  timeFilter: TimeFilter,
) => {
  const org = useOrg();
  const filter = useFilterAST();

  const userMetrics = useQuery({
    queryKey: [
      "users",
      currentPage,
      currentPageSize,
      sortLeaf,
      org?.currentOrg?.id,
      filter.store.filter,
      timeFilter,
    ],
    queryFn: async (query) => {
      const currentPage = query.queryKey[1] as number;
      const currentPageSize = query.queryKey[2] as number;
      const sortLeaf = query.queryKey[3];
      const orgId = query.queryKey[4] as string;
      const filter = query.queryKey[5] as FilterExpression | null;
      const timeFilter = query.queryKey[6] as TimeFilter;

      const jawn = getJawnClient(orgId);
      const filterNode = filter ? toFilterNode(filter) : ({} as FilterLeaf);

      const result = await jawn.POST("/v1/user/metrics/query", {
        body: {
          filter: filterNode as any,
          offset: (currentPage - 1) * currentPageSize,
          limit: currentPageSize,
          sort: sortLeaf,
          timeFilter: {
            startTimeUnixSeconds: Math.floor(timeFilter.start.getTime() / 1000),
            endTimeUnixSeconds: Math.floor(timeFilter.end.getTime() / 1000),
          },
          timeZoneDifferenceMinutes: new Date().getTimezoneOffset(),
        },
      });

      if (result.error || result.data.error) {
        throw new Error(result.error || result.data.error || "Unknown error");
      }
      return result.data.data;
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    userMetrics,
  };
};

export { useUserId, useUsers };
