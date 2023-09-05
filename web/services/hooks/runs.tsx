// import { useQuery } from "@tanstack/react-query";
import { useQuery } from "@apollo/client";
import { gql } from "../../lib/api/graphql/client";
import { HeliconeRunFilter } from "../../lib/api/graphql/schema/types/graphql";
import { SortLeafRun } from "../lib/sorts/requests/sorts";

export const GET_RUNS = gql(/* GraphQL */ `
  query FetchRuns($limit: Int, $offset: Int, $filters: [HeliconeRunFilter!]) {
    heliconeRun(filters: $filters, offset: $offset, limit: $limit) {
      id
      name
      description
      status
      created_at
      updated_at
      timeout_seconds
      task_count
      request_count
      properties {
        value
        name
      }
    }
  }
`);

export const useGetRuns = (props: {
  currentPage: number;
  currentPageSize: number;
  advancedFilter: HeliconeRunFilter[];
  sortLeaf?: SortLeafRun;
  isLive: boolean;
}) => {
  const { currentPage, currentPageSize, advancedFilter, sortLeaf, isLive } =
    props;
  if (sortLeaf) {
    throw new Error("sortLeaf not implemented");
  }
  return {
    runs: useQuery(GET_RUNS, {
      variables: {
        limit: currentPageSize,
        offset: (currentPage - 1) * currentPageSize,
        filters: advancedFilter,
      },
      pollInterval: isLive ? 2_000 : undefined,
    }),
  };
};
