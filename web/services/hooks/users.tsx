import { useQuery } from "@tanstack/react-query";

import { Result } from "../../lib/result";
import { getTimeMap } from "../../lib/timeCalculations/constants";
import { filterListToTree } from "../lib/filters/filterListToTree";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  SingleFilterDef,
} from "../lib/filters/frontendFilterDefs";
import { filterUIToFilterLeafs } from "../lib/filters/helpers/filterFunctions";

import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { useFilterAST } from "@/filterAST/context/filterContext";
import { FilterExpression } from "@/filterAST/filterAst";
import { toFilterNode } from "@/filterAST/toFilterNode";
import { UserMetric } from "@/lib/api/users/UserMetric";

const useUserId = (userId: string) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["users", userId],
    queryFn: async (query) => {
      const userId = query.queryKey[1] as string;
      const filterMap = DASHBOARD_PAGE_TABLE_FILTERS as SingleFilterDef<any>[];

      const userFilters = filterUIToFilterLeafs(filterMap, []).concat([
        {
          request_response_rmt: {
            user_id: {
              equals: userId,
            },
          },
        },
      ]);

      const timeFilter = {
        start: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
      const [response, requestOverTime, costOverTime] = await Promise.all([
        fetch("/api/request_users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: {
              user_metrics: {
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
            timeZoneDifference: new Date().getTimezoneOffset(),
          }),
        }).then((res) => res.json() as Promise<Result<UserMetric[], string>>),
        fetch("/api/metrics/requestOverTime", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeFilter: {
              start: timeFilter.start.toISOString(),
              end: timeFilter.end.toISOString(),
            },
            filter: filterListToTree(userFilters, "and"),
            apiKeyFilter: null,
            dbIncrement: "day",
            timeZoneDifference: new Date().getTimezoneOffset(),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            const cleaned = data.data.map((d: any) => ({
              requests: +d.count,
              date: getTimeMap("day")(new Date(d.time)),
            }));
            return cleaned;
            // setUserRequests(cleaned);
          })
          .catch((err) => {
            console.error(err);
          }),
        fetch("/api/metrics/costOverTime", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeFilter: {
              start: timeFilter.start.toISOString(),
              end: timeFilter.end.toISOString(),
            },
            filter: filterListToTree(userFilters, "and"),
            apiKeyFilter: null,
            dbIncrement: "day",
            timeZoneDifference: new Date().getTimezoneOffset(),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            const cleaned = data.data.map((d: any) => ({
              cost: +d.cost,
              date: getTimeMap("day")(new Date(d.time)),
            }));
            return cleaned;
          })
          .catch((err) => {
            console.error(err);
          }),
      ]);

      return {
        response,
        requestOverTime,
        costOverTime,
      };
    },
    refetchOnWindowFocus: false,
  });

  const { response, requestOverTime, costOverTime } = data || {
    response: undefined,
    requestOverTime: undefined,
    costOverTime: undefined,
  };

  const users = response?.data || [];

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
  sortLeaf: any
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
    ],
    queryFn: async (query) => {
      const currentPage = query.queryKey[1] as number;
      const currentPageSize = query.queryKey[2] as number;
      const sortLeaf = query.queryKey[3];
      const orgId = query.queryKey[4] as string;
      const filter = query.queryKey[5] as FilterExpression | null;

      const jawn = getJawnClient(orgId);

      const filterNode = filter ? toFilterNode(filter) : "all";

      const result = await jawn.POST("/v1/user/metrics/query", {
        body: {
          filter: filterNode as any,
          offset: (currentPage - 1) * currentPageSize,
          limit: currentPageSize,
          sort: sortLeaf,
          timeZoneDifferenceMinutes: new Date().getTimezoneOffset(),
        },
      });
      if (result.error || result.data.error) {
        throw new Error(result.error || result.data.error || "Unknown error");
      }
      return result;
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    userMetrics,
  };
};

export { useUserId, useUsers };
