import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { UserMetric } from "../../lib/api/users/users";
import { Result } from "../../lib/result";
import { FilterNode } from "../lib/filters/filterDefs";
import { SortLeafUsers } from "../lib/sorts/users/sorts";
import { Tier } from "../../pages/api/organization/tier";
import { useOrg } from "../../components/shared/layout/organizationContext";

/**
 * Custom hook to fetch top users data.
 *
 * @param currentPage - The current page number.
 * @param currentPageSize - The number of items per page.
 * @param sortLeaf - The sorting criteria for the users.
 * @param advancedFilter - Optional advanced filter for the users.
 * @returns An object containing the fetched data and loading state.
 */
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

/**
 * Custom hook to fetch organization tier data.
 * @returns {QueryResult<Result<Tier, string>>} The query result containing the organization tier data.
 */
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

/**
 * Custom hook to get the authorized status and loading state.
 * @param userId - The ID of the user.
 * @returns An object containing the authorized status and loading state.
 */
const useGetAuthorized = (userId: string) => {
  // Function to get the beginning of the current month
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
              response_copy_v3: {
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

  return {
    authorized:
      org?.currentOrg.tier === "free" && Number(count?.data || 0) > 100_000,
    isLoading: isCountLoading,
  };
};

export { useGetTopUsers, useGetAuthorized };
