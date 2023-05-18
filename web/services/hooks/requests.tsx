import { QueryObserverOptions, useQuery } from "@tanstack/react-query";
import { HeliconeRequest } from "../../lib/api/request/request";
import { Result } from "../../lib/result";
import { FilterNode } from "../lib/filters/filterDefs";
import { SortLeafRequest } from "../lib/sorts/requests/sorts";
import { useOrg } from "../../components/shared/layout/organizationContext";

const useGetRequests = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest,
  options?: QueryObserverOptions
) => {
  return {
    requests: useQuery({
      queryKey: [
        "requestsData",
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
          }),
        }).then(
          (res) => res.json() as Promise<Result<HeliconeRequest[], string>>
        );
      },
      refetchOnWindowFocus: false,
    }),
    count: useQuery({
      queryKey: [
        "requestsCount",
        currentPage,
        currentPageSize,
        advancedFilter,
        sortLeaf,
      ],
      queryFn: async (query) => {
        const advancedFilter = query.queryKey[3];
        return await fetch("/api/request/count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: advancedFilter,
          }),
        }).then((res) => res.json() as Promise<Result<number, string>>);
      },
      refetchOnWindowFocus: false,
    }),
  };
};

export { useGetRequests };
