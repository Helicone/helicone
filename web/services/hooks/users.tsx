import { useQuery } from "@tanstack/react-query";

import { UserMetric } from "../../lib/api/users/UserMetric";
import { Result } from "../../lib/result";
import { FilterNode } from "../lib/filters/filterDefs";
import { filterUIToFilterLeafs } from "../lib/filters/helpers/filterFunctions";
import { filterListToTree } from "../lib/filters/filterListToTree";
import { SortLeafUsers } from "../lib/sorts/users/sorts";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  SingleFilterDef,
} from "../lib/filters/frontendFilterDefs";
import { getTimeMap } from "../../lib/timeCalculations/constants";

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
              users_view: {
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
  sortLeaf: SortLeafUsers,
  advancedFilter?: FilterNode,
  timeFilter?: FilterNode
) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "users",
      currentPage,
      currentPageSize,
      advancedFilter,
      sortLeaf,
      timeFilter,
    ],
    queryFn: async (query) => {
      const currentPage = query.queryKey[1] as number;
      const currentPageSize = query.queryKey[2] as number;
      const advancedFilter = query.queryKey[3] as FilterNode | undefined;
      const sortLeaf = query.queryKey[4];
      const timeFilter = query.queryKey[5] as FilterNode | undefined;

      let filter = advancedFilter ?? timeFilter;
      if (timeFilter && advancedFilter) {
        filter = {
          left: advancedFilter,
          operator: "and",
          right: timeFilter,
        };
      }
      const [response, count] = await Promise.all([
        fetch("/api/request_users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: filter,
            offset: (currentPage - 1) * currentPageSize,
            limit: currentPageSize,
            sort: sortLeaf,
            timeZoneDifference: new Date().getTimezoneOffset(),
          }),
        }).then((res) => res.json() as Promise<Result<UserMetric[], string>>),
        fetch("/api/request_users/count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: advancedFilter,
          }),
        }).then((res) => res.json() as Promise<Result<number, string>>),
      ]);

      return {
        response,
        count,
      };
    },
    refetchOnWindowFocus: false,
  });

  const { response, count } = data || {
    response: undefined,
    count: undefined,
    dailyActiveUsers: undefined,
  };

  const users = response?.data || [];
  const from = (currentPage - 1) * currentPageSize;
  const to = currentPage * currentPageSize;
  const error = response?.error;

  return {
    users,
    count: count?.data ?? 0,
    from,
    to,
    error,
    isLoading,
    refetch,
    isRefetching,
  };
};

export { useUsers, useUserId };
