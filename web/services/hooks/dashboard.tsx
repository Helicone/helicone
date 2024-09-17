import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { UserMetric } from "../../lib/api/users/users";
import { Result } from "../../lib/result";
import { FilterNode } from "../lib/filters/filterDefs";
import { SortLeafUsers } from "../lib/sorts/users/sorts";
import { Tier } from "../../pages/api/organization/tier";
import { useOrg } from "../../components/layout/organizationContext";

const useGetTopUsers = (
  currentPage: number,
  currentPageSize: number,
  sortLeaf: SortLeafUsers,
  advancedFilter?: FilterNode
) => {
  const { data, isLoading } = useQuery({
    queryKey: [
      "top_users",
      currentPage,
      currentPageSize,
      advancedFilter,
      sortLeaf,
    ],

    queryFn: async (query) => {
      const currentPage = query.queryKey[1] as number;
      const currentPageSize = query.queryKey[2] as number;
      const advancedFilter = query.queryKey[3];
      const sortLeaf = query.queryKey[4];
      const response = await fetch("/api/request_users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: advancedFilter,
          offset: (currentPage - 1) * currentPageSize,
          limit: currentPageSize,
          sort: sortLeaf,
        }),
      }).then((res) => res.json() as Promise<Result<UserMetric[], string>>);

      return response;
    },
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
  };
};

const useOrgTier = () => {
  return useQuery({
    queryKey: [`orgTierQueryKey`],
    queryFn: async (query) => {
      const data = await fetch(`/api/organization/tier`).then(
        (res) => res.json() as Promise<Result<Tier, string>>
      );
      return data;
    },
    refetchOnWindowFocus: false,
  });
};

const useGetUnauthorized = (userId: string) => {
  function getBeginningOfMonth() {
    const today = new Date();
    const firstDateOfMonth = format(today, "yyyy-MM-01");
    return firstDateOfMonth;
  }
  const org = useOrg();

  const { data: count, isLoading: isCountLoading } = useQuery({
    queryKey: [`requestCount`],
    queryFn: async (query) => {
      const data = await fetch(`/api/request/ch/count`, {
        method: "POST",
        body: JSON.stringify({
          filter: {
            left: {
              request_response_rmt: {
                request_created_at: {
                  gte: getBeginningOfMonth(),
                },
              },
            },
            operator: "and",
            right: "all",
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json() as Promise<Result<number, string>>);
      return data;
    },
    refetchOnWindowFocus: false,
  });

  const checkAuthorizedByTier = () => {
    const currentTier = org?.currentOrg?.tier;

    if (currentTier === "free") {
      return Number(count?.data || 0) > 100_000;
    }

    if (currentTier === "pro") {
      return Number(count?.data || 0) > 500_000;
    }

    return false;
  };

  return {
    unauthorized: checkAuthorizedByTier(),
    isLoading: false,
    currentTier: org?.currentOrg?.tier,
  };
};

export { useGetTopUsers, useGetUnauthorized };
